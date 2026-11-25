import L from "leaflet";

/**
 * Escapes HTML special characters to safely interpolate listing strings in Leaflet popups.
 */
export function escapePopupHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Attaches hover-to-open and grace-period hover-to-popup-body behavior to a Leaflet marker,
 * while preserving click/tap interactions and returning a cleanup callback.
 */
export function bindHoverPopup(marker: L.Marker, htmlContent: string): () => void {
  marker.bindPopup(htmlContent, { autoPan: false });

  let closeTimer: number | null = null;
  let popupEl: HTMLElement | null = null;

  const clearCloseTimer = () => {
    if (closeTimer !== null) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer = window.setTimeout(() => {
      marker.closePopup();
    }, 220);
  };

  const onPopupEnter = () => clearCloseTimer();
  const onPopupLeave = () => scheduleClose();

  const onMarkerOver = () => {
    clearCloseTimer();
    marker.openPopup();
  };

  const onMarkerOut = () => {
    scheduleClose();
  };

  const onMarkerClick = () => {
    clearCloseTimer();
    marker.openPopup();
  };

  const onPopupOpen = () => {
    const el = marker.getPopup()?.getElement() ?? null;
    if (popupEl && popupEl !== el) {
      popupEl.removeEventListener("mouseenter", onPopupEnter);
      popupEl.removeEventListener("mouseleave", onPopupLeave);
    }
    popupEl = el;
    if (popupEl) {
      popupEl.addEventListener("mouseenter", onPopupEnter);
      popupEl.addEventListener("mouseleave", onPopupLeave);
    }
  };

  const onPopupClose = () => {
    if (popupEl) {
      popupEl.removeEventListener("mouseenter", onPopupEnter);
      popupEl.removeEventListener("mouseleave", onPopupLeave);
      popupEl = null;
    }
  };

  marker.on("mouseover", onMarkerOver);
  marker.on("mouseout", onMarkerOut);
  marker.on("click", onMarkerClick);
  marker.on("popupopen", onPopupOpen);
  marker.on("popupclose", onPopupClose);

  return () => {
    clearCloseTimer();
    onPopupClose();
    marker.off("mouseover", onMarkerOver);
    marker.off("mouseout", onMarkerOut);
    marker.off("click", onMarkerClick);
    marker.off("popupopen", onPopupOpen);
    marker.off("popupclose", onPopupClose);
  };
}
