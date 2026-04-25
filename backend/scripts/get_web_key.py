import os
import sys
from google.oauth2 import service_account
import google.auth.transport.requests
import requests
import json

CREDS_PATH = "firebase-service-account.json"

def get_web_api_key():
    credentials = service_account.Credentials.from_service_account_file(
        CREDS_PATH, 
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    token = credentials.token

    project_id = "urbanpg-a7198"
    
    # 1. Get Web Apps
    headers = {"Authorization": f"Bearer {token}"}
    url = f"https://firebase.googleapis.com/v1beta1/projects/{project_id}/webApps"
    res = requests.get(url, headers=headers)
    
    if res.status_code != 200:
        print("Error fetching web apps:", res.text)
        return
        
    apps = res.json().get("apps", [])
    app_id = None
    if not apps:
        print("No Web Apps found. Creating one...")
        create_url = f"https://firebase.googleapis.com/v1beta1/projects/{project_id}/webApps"
        create_res = requests.post(create_url, headers=headers, json={"displayName": "ApnaStay Web"})
        if create_res.status_code != 200:
            print("Failed to create Web App:", create_res.text)
            return
        
        # Wait for creation operation to complete
        import time
        time.sleep(3)
        res = requests.get(url, headers=headers)
        apps = res.json().get("apps", [])
        if apps:
            app_id = apps[0]["appId"]
    else:
        app_id = apps[0]["appId"]
        
    if not app_id:
        print("Could not retrieve Web App ID.")
        return
        
    print(f"Found Web App ID: {app_id}")
    
    # 2. Get Config (which contains the apiKey)
    config_url = f"https://firebase.googleapis.com/v1beta1/projects/{project_id}/webApps/{app_id}/config"
    config_res = requests.get(config_url, headers=headers)
    
    if config_res.status_code != 200:
        print("Error fetching config:", config_res.text)
        return
        
    config = config_res.json()
    print("\n--- ADD TO FRONTEND .env ---")
    print(f"VITE_FIREBASE_API_KEY={config.get('apiKey')}")
    print(f"VITE_FIREBASE_AUTH_DOMAIN={config.get('authDomain')}")
    print(f"VITE_FIREBASE_PROJECT_ID={config.get('projectId')}")
    print(f"VITE_FIREBASE_APP_ID={config.get('appId')}")
    print("----------------------------\n")
    
    # 3. Write directly to frontend .env
    env_content = f"""VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY={config.get('apiKey')}
VITE_FIREBASE_AUTH_DOMAIN={config.get('authDomain')}
VITE_FIREBASE_PROJECT_ID={config.get('projectId')}
VITE_FIREBASE_APP_ID={config.get('appId')}
"""
    with open("../frontend/.env", "w") as f:
        f.write(env_content)
    print("✅ Successfully updated e:/pgliving/frontend/.env !")

if __name__ == "__main__":
    get_web_api_key()
