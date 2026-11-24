import React from "react";
import {
  Wifi, Utensils, Snowflake, ParkingCircle, WashingMachine,
  Dumbbell, Cctv, ShowerHead, Zap, BookOpen,
  Sun, Shield, Leaf, Waves, Home, MapPin, Search,
  Frown, User, Users, Target, Calendar, Wrench, FileText,
  Sofa, Building, ArrowUpToLine, ArrowUpDown, Bath, CookingPot,
  Scaling, Droplets, Clock, DoorClosed, Phone, Moon,
  ShieldAlert, MonitorPlay, Video, Play, ClipboardList, Map,
  MessageSquare, PhoneCall, HandCoins, Info, Heart, Star, Flame, Sparkles
} from "lucide-react";

const IconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  // Amenities
  wifi: Wifi,
  food: Utensils,
  ac: Snowflake,
  parking: ParkingCircle,
  laundry: WashingMachine,
  gym: Dumbbell,
  cctv: Cctv,
  geyser: ShowerHead,
  power_backup: Zap,
  study_room: BookOpen,
  terrace: Sun,
  security: Shield,
  garden: Leaf,
  swimming_pool: Waves,

  // Property Metadata
  furnishing: Sofa,
  floor: Building,
  total_floors: ArrowUpToLine,
  lift: ArrowUpDown,
  society_name: Home,
  num_bathrooms: ShowerHead,
  bathroom_type: Bath,
  kitchen_access: CookingPot,
  size_sqft: Scaling,
  parking_type: ParkingCircle,
  water_supply: Droplets,
  mess_timing: Clock,
  gate_timing: DoorClosed,
  warden_contact: Phone,
  curfew_time: Moon,
  warden_on_site: ShieldAlert,
  total_capacity: Users,
  study_hall: BookOpen,
  community_events: Sparkles,
  coworking: MonitorPlay,
  min_stay_duration: Calendar,

  // General UI
  home: Home,
  map_pin: MapPin,
  search: Search,
  frown: Frown,
  user: User,
  users: Users,
  target: Target,
  calendar: Calendar,
  wrench: Wrench,
  file_text: FileText,
  video: Video,
  play: Play,
  clipboard: ClipboardList,
  map: Map,
  message: MessageSquare,
  phone: PhoneCall,
  commission: HandCoins,
  info: Info,
  heart: Heart,
  star: Star,
  flame: Flame,
  sparkles: Sparkles,
};

export function Icon({ name, className, ...props }: { name: string; className?: string } & React.SVGProps<SVGSVGElement>) {
  const LucideIcon = IconMap[name.toLowerCase()] || Info;
  return <LucideIcon className={className} {...props} />;
}
