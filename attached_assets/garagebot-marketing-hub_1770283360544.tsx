import { PageLayout } from "@/components/layout/page-layout";
import { BentoGrid, BentoItem } from "@/components/layout/bento-grid";
import { GlassCard } from "@/components/ui/glass-card";
import { AIAgentTab } from "@/components/ui/ai-agent-tab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TenantSwitcher, useTenantFilter } from "@/components/tenant-switcher";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

// Marketing Hub hero images
import crewTeamPhoto from "@/assets/marketing/crew-10-team-photo.png";
import interiorLivingRoom from "@/assets/marketing/interior-01-living-room-gray.png";
import crewMeasuring from "@/assets/marketing/crew-06-measuring.png";
import commercialLobby from "@/assets/marketing/commercial-office-05-lobby.png";
import colorConsult from "@/assets/marketing/general-01-color-consult.png";

// Cabinet marketing images
import cabinetWhiteKitchen from "@/assets/marketing/cabinet-white-kitchen.jpg";
import cabinetNavyBlue from "@/assets/marketing/cabinet-navy-blue.jpg";
import cabinetBathroomVanity from "@/assets/marketing/cabinet-bathroom-vanity.jpg";
import cabinetBuiltInShelving from "@/assets/marketing/cabinet-built-in-shelving.jpg";
import cabinetLaundryRoom from "@/assets/marketing/cabinet-laundry-room.jpg";
import cabinetPantry from "@/assets/marketing/cabinet-pantry.jpg";
import cabinetGrayKitchen from "@/assets/marketing/cabinet-gray-kitchen.jpg";
import cabinetTwoTone from "@/assets/marketing/cabinet-two-tone.jpg";
import cabinetOfficeBuiltin from "@/assets/marketing/cabinet-office-builtin.jpg";
import cabinetEntertainment from "@/assets/marketing/cabinet-entertainment.jpg";

// Category carousel images
import categoryInteriorWalls from "@/assets/marketing/category-interior-walls.jpg";
import categoryExteriorHome from "@/assets/marketing/category-exterior-home.jpg";
import categoryCabinetWork from "@/assets/marketing/category-cabinet-work.jpg";
import categoryDeckStaining from "@/assets/marketing/category-deck-staining.jpg";
import categoryTrimDetail from "@/assets/marketing/category-trim-detail.jpg";
import categoryDoorPainting from "@/assets/marketing/category-door-painting.jpg";
import categoryCommercialSpace from "@/assets/marketing/category-commercial-space.jpg";
import categoryBeforeAfter from "@/assets/marketing/category-before-after.jpg";
import categoryTeamAction from "@/assets/marketing/category-team-action.jpg";
import categoryGeneral from "@/assets/marketing/category-general.jpg";

// Exterior home images
import exterior01CurbAppeal from "@/assets/marketing/exterior-01-curb-appeal.jpg";
import exterior02Modern from "@/assets/marketing/exterior-02-modern.jpg";
import exterior03Traditional from "@/assets/marketing/exterior-03-traditional.jpg";
import exterior04Luxury from "@/assets/marketing/exterior-04-luxury.jpg";
import exterior05Suburban from "@/assets/marketing/exterior-05-suburban.jpg";
import exterior06Colonial from "@/assets/marketing/exterior-06-colonial.jpg";
import exterior07Ranch from "@/assets/marketing/exterior-07-ranch.jpg";
import exterior08Craftsman from "@/assets/marketing/exterior-08-craftsman.jpg";
import exterior09Twostory from "@/assets/marketing/exterior-09-twostory.jpg";
import exterior10Porch from "@/assets/marketing/exterior-10-porch.jpg";
import exterior11Historic from "@/assets/marketing/exterior-11-historic.jpg";
import exterior12Garage from "@/assets/marketing/exterior-12-garage.jpg";

// Interior images
import interior01Living from "@/assets/marketing/interior-01-living.jpg";
import interior02Bedroom from "@/assets/marketing/interior-02-bedroom.jpg";
import interior03Kitchen from "@/assets/marketing/interior-03-kitchen.jpg";
import interior04Dining from "@/assets/marketing/interior-04-dining.jpg";
import interior05Office from "@/assets/marketing/interior-05-office.jpg";
import interior06Bathroom from "@/assets/marketing/interior-06-bathroom.jpg";
import interior07Nursery from "@/assets/marketing/interior-07-nursery.jpg";
import interior08Accent from "@/assets/marketing/interior-08-accent.jpg";
import interior09Open from "@/assets/marketing/interior-09-open.jpg";

// Other category images
import deck01Backyard from "@/assets/marketing/deck-01-backyard.jpg";
import trim01Crown from "@/assets/marketing/trim-01-crown.jpg";
import trim02Baseboard from "@/assets/marketing/trim-02-baseboard.jpg";
import door01Front from "@/assets/marketing/door-01-front.jpg";
import door02Interior from "@/assets/marketing/door-02-interior.jpg";
import commercial01Office from "@/assets/marketing/commercial-01-office.jpg";
import commercial02Retail from "@/assets/marketing/commercial-02-retail.jpg";
import team01Crew from "@/assets/marketing/team-01-crew.jpg";
import beforeafter01Room from "@/assets/marketing/beforeafter-01-room.jpg";
import general02Swatches from "@/assets/marketing/general-02-swatches.jpg";

// Brand logos
import nppLogo from "@/assets/branding/logo-npp-vertical.jpg";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, Instagram, Facebook, Home, Calendar, Camera,
  TrendingUp, Clock, CheckCircle, AlertTriangle, Edit, 
  Trash2, Plus, Copy, Lock, User, Mic, X,
  Sparkles, PenTool, Palette, Building2, TreePine, DoorOpen,
  LayoutGrid, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  FileText, Users, BarChart3, Target, Lightbulb, Volume2, VolumeX, Loader2,
  ImageIcon, MessageSquare, Layers, Wand2, Star, LogOut, BookOpen, ArrowRight, Play, Link,
  DollarSign, Receipt, PieChart as PieChartIcon, Wallet
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, Zap, Globe, Smartphone, Monitor, Tablet, RefreshCw, MapPin, ArrowLeft, Download, Share2, ExternalLink, Info, Settings } from "lucide-react";
import { AreaChart, Area } from "recharts";
import { format, subWeeks, subDays, isAfter, startOfWeek, addDays, eachDayOfInterval, isSameDay } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Dynamic brand type supports all tenants
type TenantBrand = string;

interface SocialPost {
  id: string;
  brand: TenantBrand;
  platform: "instagram" | "facebook" | "nextdoor";
  type: "evergreen" | "seasonal";
  category: "interior" | "exterior" | "commercial" | "cabinets" | "doors" | "trim" | "decks" | "general";
  content: string;
  imageUrl?: string;
  status: "draft" | "scheduled" | "posted";
  scheduledDate?: string;
  lastUsed?: string;
  claimedBy?: string;
  createdAt: string;
}

interface CalendarDay {
  date: Date;
  posts: SocialPost[];
}

// DAM System Types
type ImageSubject = "interior-walls" | "exterior-home" | "cabinet-work" | "deck-staining" | "trim-detail" | "door-painting" | "commercial-space" | "before-after" | "team-action" | "general";
type ImageStyle = "finished-result" | "before-after" | "action-shot" | "detail-closeup" | "wide-angle" | "testimonial";
type ImageSeason = "spring" | "summer" | "fall" | "winter" | "all-year";

interface LibraryImage {
  id: string;
  brand: TenantBrand;
  url: string;
  subject: ImageSubject;
  style: ImageStyle;
  season: ImageSeason;
  quality: 1 | 2 | 3 | 4 | 5;
  description: string;
  tags: string[];
  createdAt: string;
  isUserUploaded?: boolean;
}

type MessageTone = "professional" | "friendly" | "promotional" | "educational" | "urgent";
type MessageCTA = "book-now" | "get-quote" | "learn-more" | "call-us" | "visit-site" | "none";
type ContentType = "educational" | "gamified" | "sales" | "seasonal" | "evergreen" | "testimonial" | "behind-scenes";
type SocialPlatform = "instagram" | "facebook" | "nextdoor" | "x" | "linkedin" | "google" | "all";

// Platform character limits
const PLATFORM_CHAR_LIMITS: Record<SocialPlatform, { limit: number; name: string; icon?: string }> = {
  x: { limit: 280, name: 'X (Twitter)' },
  instagram: { limit: 2200, name: 'Instagram' },
  facebook: { limit: 63206, name: 'Facebook' },
  nextdoor: { limit: 2000, name: 'Nextdoor' },
  linkedin: { limit: 3000, name: 'LinkedIn' },
  google: { limit: 1500, name: 'Google Business' },
  all: { limit: 280, name: 'All Platforms' }, // Use strictest limit for "all"
};

interface MessageTemplate {
  id: string;
  brand: TenantBrand;
  content: string;
  subject: ImageSubject;
  tone: MessageTone;
  cta: MessageCTA;
  platform: SocialPlatform;
  contentType?: ContentType;
  hashtags: string[];
  createdAt: string;
}

interface ContentBundle {
  id: string;
  brand: TenantBrand;
  imageId: string;
  messageId: string;
  status: "suggested" | "circulating" | "posted" | "removed" | "approved" | "scheduled";
  scheduledDate?: string;
  platform: SocialPlatform;
  postType: "organic" | "paid_ad";
  targetAudience?: string;
  budgetRange?: string;
  ctaButton?: "learn_more" | "shop_now" | "contact_us" | "get_quote" | "book_now";
  createdAt: string;
  postedAt?: string;
  metrics?: {
    impressions: number;
    reach: number;
    clicks: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    leads: number;
    conversions: number;
    spend?: number;
    revenue?: number;
  };
}

type ContentTypeFilter = "all" | "organic" | "paid_ad";

const IMAGE_SUBJECTS: { id: ImageSubject; label: string; image: string }[] = [
  { id: "interior-walls", label: "Interior Walls", image: categoryInteriorWalls },
  { id: "exterior-home", label: "Exterior Home", image: categoryExteriorHome },
  { id: "cabinet-work", label: "Cabinet Work", image: categoryCabinetWork },
  { id: "deck-staining", label: "Deck Staining", image: categoryDeckStaining },
  { id: "trim-detail", label: "Trim & Detail", image: categoryTrimDetail },
  { id: "door-painting", label: "Door Painting", image: categoryDoorPainting },
  { id: "commercial-space", label: "Commercial Space", image: categoryCommercialSpace },
  { id: "before-after", label: "Before/After", image: categoryBeforeAfter },
  { id: "team-action", label: "Team Action", image: categoryTeamAction },
  { id: "general", label: "General/Brand", image: categoryGeneral },
];

const IMAGE_STYLES: { id: ImageStyle; label: string }[] = [
  { id: "finished-result", label: "Finished Result" },
  { id: "before-after", label: "Before/After" },
  { id: "action-shot", label: "Action Shot" },
  { id: "detail-closeup", label: "Detail Close-up" },
  { id: "wide-angle", label: "Wide Angle" },
  { id: "testimonial", label: "Testimonial" },
];

const IMAGE_SEASONS: { id: ImageSeason; label: string }[] = [
  { id: "all-year", label: "All Year" },
  { id: "spring", label: "Spring" },
  { id: "summer", label: "Summer" },
  { id: "fall", label: "Fall" },
  { id: "winter", label: "Winter" },
];

const MESSAGE_TONES: { id: MessageTone; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "promotional", label: "Promotional" },
  { id: "educational", label: "Educational" },
  { id: "urgent", label: "Urgent" },
];

const MESSAGE_CTAS: { id: MessageCTA; label: string }[] = [
  { id: "none", label: "No CTA" },
  { id: "book-now", label: "Book Now" },
  { id: "get-quote", label: "Get Quote" },
  { id: "learn-more", label: "Learn More" },
  { id: "call-us", label: "Call Us" },
  { id: "visit-site", label: "Visit Site" },
];

const CATEGORIES = [
  { id: "interior", label: "Interior", icon: Home },
  { id: "exterior", label: "Exterior", icon: Building2 },
  { id: "commercial", label: "Commercial", icon: Building2 },
  { id: "cabinets", label: "Cabinets", icon: LayoutGrid },
  { id: "doors", label: "Doors", icon: DoorOpen },
  { id: "trim", label: "Trim", icon: PenTool },
  { id: "decks", label: "Decks & Fences", icon: TreePine },
  { id: "general", label: "General", icon: Palette },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-600" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "from-blue-600 to-blue-800" },
  { id: "nextdoor", label: "Nextdoor", icon: Home, color: "from-green-500 to-green-700" },
];

const SAMPLE_EVERGREEN_NPP: Partial<SocialPost>[] = [
  { content: "Transforming familiar spaces into extraordinary places. Nashville Painting Professionals - quality craftsmanship, exceptional results.", category: "general", platform: "instagram", status: "posted" },
  { content: "Interior painting that brings your vision to life. Transforming familiar spaces into extraordinary places.", category: "interior", platform: "instagram", status: "posted" },
  { content: "Protect your investment with professional exterior painting. Weather-resistant finishes that last.", category: "exterior", platform: "facebook", status: "scheduled" },
  { content: "Commercial painting solutions for businesses that demand excellence. Minimal disruption, maximum impact.", category: "commercial", platform: "facebook", status: "posted" },
  { content: "Cabinet refinishing that saves thousands over replacement. Fresh look, fraction of the cost.", category: "cabinets", platform: "nextdoor", status: "scheduled" },
  { content: "The details matter. Professional trim and door painting for a polished finish.", category: "trim", platform: "instagram", status: "draft" },
  { content: "Deck staining and fence refinishing. Extend the life of your outdoor spaces.", category: "decks", platform: "nextdoor", status: "posted" },
  { content: "Why choose Nashville Painting Professionals? We're transforming familiar spaces into extraordinary places - one home at a time.", category: "general", platform: "facebook", status: "draft" },
  { content: "Before & After: See the difference professional painting makes. Free estimates available.", category: "general", platform: "instagram", status: "posted" },
  { content: "Your neighbors trust us. Join hundreds of satisfied Nashville homeowners.", category: "general", platform: "nextdoor", status: "posted" },
  { content: "Quality paint. Expert application. Transforming familiar spaces into extraordinary places.", category: "general", platform: "instagram", status: "scheduled" },
  { content: "From prep to perfection - our process ensures flawless results every time.", category: "general", platform: "facebook", status: "draft" },
  { content: "Nashville's premier painting contractor. Transforming familiar spaces into extraordinary places since 2015.", category: "general", platform: "facebook", status: "posted" },
  { content: "Kitchen cabinet refresh special! Transform your kitchen without the full renovation cost.", category: "cabinets", platform: "nextdoor", status: "draft" },
  { content: "Commercial property managers love working with NPP. On-time, on-budget, every time.", category: "commercial", platform: "facebook", status: "posted" },
];

const SAMPLE_EVERGREEN_LUME: Partial<SocialPost>[] = [
  { content: "We elevate the backdrop of your life. Paint Pros Co - where color meets craftsmanship.", category: "general", platform: "instagram", status: "posted" },
  { content: "Interior transformations that reflect your style. Elevating the backdrop of your life.", category: "interior", platform: "instagram", status: "scheduled" },
  { content: "Exterior painting with lasting beauty. Paint Pros protects what matters most.", category: "exterior", platform: "facebook", status: "posted" },
  { content: "Commercial spaces deserve professional finishes. Paint Pros delivers on time, every time.", category: "commercial", platform: "facebook", status: "draft" },
  { content: "Breathe new life into your kitchen. Cabinet painting by Paint Pros - elevating the backdrop of your life.", category: "cabinets", platform: "nextdoor", status: "posted" },
  { content: "Precision trim work. The finishing touch your home deserves.", category: "trim", platform: "instagram", status: "draft" },
  { content: "Outdoor living, perfected. Deck and fence services by Paint Pros Co.", category: "decks", platform: "nextdoor", status: "scheduled" },
  { content: "Why Paint Pros? We elevate the backdrop of your life. Free consultations available.", category: "general", platform: "facebook", status: "posted" },
  { content: "See the Paint Pros difference. Stunning transformations, happy homeowners.", category: "general", platform: "instagram", status: "posted" },
  { content: "Trusted by your community. Paint Pros Co - elevating the backdrop of your life.", category: "general", platform: "nextdoor", status: "draft" },
  { content: "We elevate the backdrop of your life. Paint Pros Co - where excellence shines.", category: "general", platform: "instagram", status: "scheduled" },
  { content: "Professional painters. Premium results. Elevating the backdrop of your life.", category: "general", platform: "facebook", status: "posted" },
  { content: "Paint Pros Co - your trusted partner in home transformation. Elevating the backdrop of your life.", category: "general", platform: "facebook", status: "draft" },
  { content: "Boutique painting service for discerning homeowners. Elevating the backdrop of your life.", category: "interior", platform: "instagram", status: "posted" },
];

const SAMPLE_SEASONAL_NPP: Partial<SocialPost>[] = [
  { content: "Spring is here! Book your exterior refresh before the summer rush. Free estimates this week only.", category: "exterior", platform: "instagram" },
  { content: "New Year, New Colors! Start 2026 with a fresh interior look. 10% off January bookings.", category: "interior", platform: "facebook" },
  { content: "Summer deck season is coming! Get your deck stained now before the heat sets in.", category: "decks", platform: "nextdoor" },
  { content: "Fall painting special: Interior projects with premium paint at no extra charge.", category: "interior", platform: "instagram" },
  { content: "Holiday prep: Get your home guest-ready with a quick refresh. Booking now for December.", category: "general", platform: "facebook" },
];

const SAMPLE_SEASONAL_LUME: Partial<SocialPost>[] = [
  { content: "Spring refresh season! Paint Pros is booking exterior projects now. Beat the summer rush.", category: "exterior", platform: "instagram" },
  { content: "New Year special: Transform your space with Paint Pros. Complimentary color consultation in January.", category: "interior", platform: "facebook" },
  { content: "Deck season approaches! Protect your outdoor investment with Paint Pros' expert staining.", category: "decks", platform: "nextdoor" },
  { content: "Fall interior special: Cozy up with new colors. Paint Pros' autumn palette recommendations.", category: "interior", platform: "instagram" },
  { content: "Holiday entertaining? Paint Pros can refresh your space before the guests arrive.", category: "general", platform: "facebook" },
];

// Weekly posting schedule: MWF = Rotation A, TThSat = Rotation B, Sunday = Planning
const WEEKLY_SCHEDULE = {
  0: { rotation: 'planning', label: 'Sunday Planning', description: 'Review week performance & plan ahead' },
  1: { rotation: 'A', label: 'Monday - Rotation A', description: 'Showcase project or before/after' },
  2: { rotation: 'B', label: 'Tuesday - Rotation B', description: 'Tips, education, or team spotlight' },
  3: { rotation: 'A', label: 'Wednesday - Rotation A', description: 'Customer testimonial or review' },
  4: { rotation: 'B', label: 'Thursday - Rotation B', description: 'Behind the scenes or process' },
  5: { rotation: 'A', label: 'Friday - Rotation A', description: 'Weekend inspiration or seasonal' },
  6: { rotation: 'B', label: 'Saturday - Rotation B', description: 'Community engagement or local' },
};

// Content categories for each rotation
const ROTATION_CATEGORIES = {
  A: ['exterior', 'interior', 'cabinets', 'before-after'], // Project showcase rotation
  B: ['team', 'tips', 'general', 'commercial'], // Engagement rotation
};

interface TodaysSuggestedPostProps {
  contentBundles: any[];
  allImages: any[];
  messageTemplates: any[];
}

function TodaysSuggestedPost({ contentBundles, allImages, messageTemplates }: { contentBundles: any[], allImages: any[], messageTemplates: any[] }) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const schedule = WEEKLY_SCHEDULE[dayOfWeek as keyof typeof WEEKLY_SCHEDULE];
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const { toast } = useToast();
  
  // Get suggested content based on rotation
  const getSuggestedContent = () => {
    if (schedule.rotation === 'planning') {
      return null; // Sunday is planning day
    }
    
    const rotationCategories = ROTATION_CATEGORIES[schedule.rotation as 'A' | 'B'];
    
    // Try to find a bundle first
    const matchingBundle = contentBundles.find(b => 
      rotationCategories.some(cat => b.category?.toLowerCase().includes(cat))
    );
    
    if (matchingBundle) {
      return {
        type: 'bundle',
        data: matchingBundle,
        image: matchingBundle.imageUrl,
        imageId: matchingBundle.imageId,
        message: matchingBundle.message || messageTemplates.find(m => m.category === matchingBundle.category)?.content
      };
    }
    
    // Fall back to matching image + message
    const matchingImage = allImages.find(img => 
      rotationCategories.some(cat => img.category?.toLowerCase().includes(cat))
    );
    const matchingMessage = messageTemplates.find(m => 
      rotationCategories.some(cat => m.category?.toLowerCase().includes(cat))
    );
    
    if (matchingImage || matchingMessage) {
      return {
        type: 'suggested',
        image: matchingImage?.url || matchingImage?.src,
        imageId: matchingImage?.id,
        message: matchingMessage?.content,
        category: matchingImage?.category || matchingMessage?.category
      };
    }
    
    // Default suggestions if no matching content
    return {
      type: 'default',
      message: schedule.description,
      category: rotationCategories[0]
    };
  };
  
  const suggestion = getSuggestedContent();
  
  // Get current display image and message (edited or suggested)
  const currentImage = selectedImageId 
    ? allImages.find(i => i.id === selectedImageId) 
    : (suggestion?.imageId ? allImages.find(i => i.id === suggestion.imageId) : null);
  const currentImageUrl = currentImage?.url || currentImage?.src || suggestion?.image;
  const currentMessage = editedMessage || suggestion?.message || '';
  
  // Initialize edited values when entering edit mode
  const handleStartEdit = () => {
    setEditedMessage(suggestion?.message || '');
    setSelectedImageId(suggestion?.imageId || null);
    setIsEditing(true);
  };
  
  // Copy message to clipboard
  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(currentMessage);
    toast({ title: 'Message Copied', description: 'Ready to paste into your social media app' });
  };
  
  // Download image
  const handleDownloadImage = async () => {
    if (!currentImageUrl) return;
    try {
      const response = await fetch(currentImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suggested-post-${new Date().toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'Image Downloaded', description: 'Ready to upload to your social media' });
    } catch (err) {
      toast({ title: 'Download Failed', description: 'Could not download image', variant: 'destructive' });
    }
  };
  
  // Save edited post
  const handleSave = () => {
    setIsEditing(false);
    toast({ title: 'Post Updated', description: 'Your customized post is ready to download' });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/20 to-transparent rounded-bl-full" />
      
      <div className="relative p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Today's Suggested Post
                <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
                  {schedule.rotation === 'planning' ? 'Plan Day' : `Rotation ${schedule.rotation}`}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">{schedule.label}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
        
        {schedule.rotation === 'planning' ? (
          <div className="bg-white/50 dark:bg-white/5 rounded-lg p-4 border border-white/20">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              <strong>Sunday Planning Day</strong> - Review this week's performance and prepare next week's content.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                <p className="font-medium text-blue-700 dark:text-blue-300">MWF Posts</p>
                <p className="text-muted-foreground">Projects & Showcases</p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-2 text-center">
                <p className="font-medium text-purple-700 dark:text-purple-300">TThSat Posts</p>
                <p className="text-muted-foreground">Tips & Engagement</p>
              </div>
            </div>
          </div>
        ) : suggestion ? (
          <div className="space-y-3">
            {/* Edit Mode: Image Picker */}
            {isEditing && showImagePicker ? (
              <div className="bg-white/50 dark:bg-white/5 rounded-lg p-3 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Select Image</span>
                  <Button size="sm" variant="ghost" onClick={() => setShowImagePicker(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {allImages.slice(0, 12).map(img => (
                    <button
                      key={img.id}
                      onClick={() => { setSelectedImageId(img.id); setShowImagePicker(false); }}
                      className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageId === img.id ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-transparent hover:border-white/30'
                      }`}
                    >
                      <img src={img.url || img.src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                {currentImageUrl && (
                  <div className="relative group">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
                      <img src={currentImageUrl} alt="Suggested" className="w-full h-full object-cover" />
                    </div>
                    {isEditing && (
                      <button 
                        onClick={() => setShowImagePicker(true)}
                        className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <Textarea
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      className="text-sm min-h-[60px] bg-white/50 dark:bg-white/5 border-white/20"
                      placeholder="Edit your message..."
                    />
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                      {currentMessage || schedule.description}
                    </p>
                  )}
                  {!isEditing && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {suggestion.category && (
                        <Badge variant="secondary" className="text-xs capitalize">{suggestion.category}</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Instagram className="w-3 h-3 mr-1" />
                        Best for Instagram
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Add content to your library to get personalized suggestions.</p>
        )}
        
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-4 border-t border-white/10"
          >
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">This Week's Schedule</h4>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div 
                  key={i} 
                  className={`py-1.5 rounded text-xs ${
                    i === dayOfWeek 
                      ? 'bg-amber-500 text-white font-bold' 
                      : WEEKLY_SCHEDULE[i as keyof typeof WEEKLY_SCHEDULE].rotation === 'A'
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        : WEEKLY_SCHEDULE[i as keyof typeof WEEKLY_SCHEDULE].rotation === 'B'
                          ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> MWF: Projects</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> TThSat: Engagement</span>
            </div>
          </motion.div>
        )}
        
        {schedule.rotation !== 'planning' && (
          <div className="flex gap-2 mt-4">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={handleStartEdit} data-testid="button-edit-suggested">
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" onClick={handleCopyMessage} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Message
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadImage} className="flex-1">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Image
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Meta Ads Spend Section - Fetches real billing data from Meta
function MetaAdSpendSection({ tenantId }: { tenantId: string }) {
  const { data: adInsights, isLoading } = useQuery<{
    success: boolean;
    insights: Array<{
      campaignId: string;
      campaignName: string;
      spend: string;
      impressions: string;
      reach: string;
      clicks: string;
      dateStart: string;
      dateStop: string;
    }>;
    totalSpend: number;
    accountSpend?: string;
    currency: string;
  }>({
    queryKey: ["/api/meta", tenantId, "ad-insights"],
    enabled: !!tenantId,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-6 border-l-4 border-blue-500">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (!adInsights?.success || !adInsights.insights?.length) {
    return null;
  }

  const totalSpend = adInsights.totalSpend || 0;
  const totalImpressions = adInsights.insights.reduce((sum, i) => sum + parseInt(i.impressions || '0'), 0);
  const totalReach = adInsights.insights.reduce((sum, i) => sum + parseInt(i.reach || '0'), 0);
  const totalClicks = adInsights.insights.reduce((sum, i) => sum + parseInt(i.clicks || '0'), 0);

  return (
    <GlassCard className="p-6 border-l-4 border-green-500 bg-green-500/5">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-500" />
        Meta Ads Spend - Live Data
        <Badge variant="outline" className="ml-2 text-green-600 border-green-500">Live</Badge>
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-2xl font-bold text-green-600">${totalSpend.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Spend</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-2xl font-bold text-blue-600">{totalImpressions.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Impressions</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <p className="text-2xl font-bold text-purple-600">{totalReach.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Reach</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <p className="text-2xl font-bold text-orange-600">{totalClicks}</p>
          <p className="text-xs text-muted-foreground">Clicks</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground mb-2">Campaign Breakdown:</p>
        {adInsights.insights.map((insight) => (
          <div key={insight.campaignId} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{insight.campaignName}</p>
              <p className="text-xs text-muted-foreground">{insight.dateStart}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{parseInt(insight.impressions).toLocaleString()} imp</span>
              <span className="font-semibold text-green-600">${parseFloat(insight.spend).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default function MarketingHub() {
  const tenant = useTenant();
  const { toast } = useToast();
  const { selectedTenant, setSelectedTenant } = useTenantFilter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPinChange, setShowPinChange] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Logout function - clears session and resets state
  const handleLogout = () => {
    localStorage.removeItem("marketing_session");
    setIsAuthenticated(false);
    setUserRole("");
    setUserName("");
    setPin("");
    setStayLoggedIn(false);
  };
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [activeTab, setActiveTab] = useState<"content" | "analytics" | "calendar" | "playbook" | "budget">("content");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicatePost, setDuplicatePost] = useState<SocialPost | null>(null);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [calendarWeekStart, setCalendarWeekStart] = useState(startOfWeek(new Date()));
  const [isReading, setIsReading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // DAM System State
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  
  // Fetch real photos from database (crew uploads)
  const { data: dbImages } = useQuery<any[]>({
    queryKey: ["/api/marketing/images", selectedTenant],
  });
  
  // Fetch REAL marketing stats from database
  const { data: marketingStats, isLoading: statsLoading } = useQuery<{
    posts: { total: number; published: number; scheduled: number; drafts: number; failed: number };
    platforms: { facebook: number; instagram: number };
    engagement: { impressions: number; reach: number; engagement: number; clicks: number; likes: number; comments: number; shares: number; leads: number };
    ads: { activeCampaigns: number; totalSpend: number; dailyBudget: number };
    recentPosts: Array<{ id: string; platform: string; message: string; publishedAt: string; impressions: number; reach: number; engagement: number }>;
  }>({
    queryKey: ["/api/marketing", selectedTenant, "stats"],
    enabled: !!selectedTenant,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  const [contentBundles, setContentBundles] = useState<ContentBundle[]>([]);
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>("all");
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [showAddMessageModal, setShowAddMessageModal] = useState(false);
  const [metaConnected, setMetaConnected] = useState(false);
  const [editingMetricsBundle, setEditingMetricsBundle] = useState<ContentBundle | null>(null);
  const [metricsForm, setMetricsForm] = useState({
    impressions: 0,
    reach: 0,
    clicks: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    leads: 0,
    conversions: 0,
    spend: 0,
    revenue: 0
  });

  // Live Posts from Database
  interface LivePost {
    id: string;
    platform: string;
    status: string;
    message: string;
    imageUrl: string | null;
    scheduledAt: string;
    publishedAt: string | null;
    impressions: number;
    reach: number;
    engagement: number;
    clicks: number;
    likes: number;
    comments: number;
    shares: number;
    performanceScore: number | null;
  }
  
  const { data: livePosts, refetch: refetchLivePosts } = useQuery<LivePost[]>({
    queryKey: ["/api/marketing", selectedTenant, "live-posts"],
    enabled: !!selectedTenant,
    refetchInterval: 60000,
  });

  // Scheduled Posts Queue
  interface ScheduledPost {
    id: string;
    platform: string;
    status: string;
    message: string;
    imageUrl: string | null;
    scheduledAt: string;
  }
  
  const { data: scheduledQueue, refetch: refetchQueue } = useQuery<ScheduledPost[]>({
    queryKey: ["/api/meta", selectedTenant, "scheduled"],
    enabled: !!selectedTenant,
    refetchInterval: 60000,
  });

  // Ad Campaigns
  interface AdCampaign {
    id: string;
    name: string;
    platform: string;
    status: string;
    dailyBudget: string;
    startDate: string | null;
    endDate: string | null;
    adImageUrl: string | null;
    totalSpent: string;
    impressions: number;
    clicks: number;
  }
  
  const { data: adCampaigns, refetch: refetchCampaigns } = useQuery<AdCampaign[]>({
    queryKey: ["/api/ad-campaigns", selectedTenant],
    enabled: !!selectedTenant,
    refetchInterval: 60000,
  });

  // Selected post for analytics view
  const [selectedPost, setSelectedPost] = useState<LivePost | null>(null);
  
  // Queue management state
  const [selectedQueuePost, setSelectedQueuePost] = useState<ScheduledPost | null>(null);
  const [queuePostIndex, setQueuePostIndex] = useState<number>(0);
  
  const [showQuickPostModal, setShowQuickPostModal] = useState(false);
  const [quickPostForm, setQuickPostForm] = useState({
    message: "",
    imageUrl: "",
    platform: "facebook" as "facebook" | "instagram",
    generateWithAI: false,
    aiPrompt: ""
  });
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  
  // Notes/Notepad state
  interface TeamNote {
    id: string;
    author: string;
    role: string;
    content: string;
    createdAt: string;
    tenant: string;
  }
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>(() => {
    const saved = localStorage.getItem("marketing_team_notes");
    return saved ? JSON.parse(saved) : [];
  });
  const [newNoteContent, setNewNoteContent] = useState("");
  
  // Dismiss intro sections (persists in localStorage per user)
  const [introHidden, setIntroHidden] = useState(() => {
    const saved = localStorage.getItem(`marketing_intro_hidden_${userRole}`);
    return saved === "true";
  });
  const hideIntro = () => {
    setIntroHidden(true);
    localStorage.setItem(`marketing_intro_hidden_${userRole}`, "true");
  };
  const showIntro = () => {
    setIntroHidden(false);
    localStorage.setItem(`marketing_intro_hidden_${userRole}`, "false");
  };
  
  const [imageSubjectFilter, setImageSubjectFilter] = useState<string>("all");
  const [messageSubjectFilter, setMessageSubjectFilter] = useState<string>("all");
  const [isGeneratingMatch, setIsGeneratingMatch] = useState(false);
  const [imageLibraryTab, setImageLibraryTab] = useState<"live" | "ai">("live");
  
  // Combine library images with database photos from crew uploads
  const allImages = useMemo(() => {
    if (!dbImages || dbImages.length === 0) return libraryImages;
    
    // Convert database images to LibraryImage format
    const convertedDbImages: LibraryImage[] = dbImages.map((img: any) => ({
      id: `db-${img.id}`,
      brand: img.tenantId as TenantBrand,
      url: img.filePath,
      subject: (img.category === "interior" ? "interior-walls" : 
               img.category === "exterior" ? "exterior-home" : 
               img.category === "cabinets" ? "cabinet-work" :
               img.category === "commercial" ? "commercial-space" :
               img.category === "trim" ? "trim-detail" :
               img.category === "deck" ? "deck-staining" :
               img.subcategory === "before" || img.subcategory === "after" ? "before-after" :
               "general") as ImageSubject,
      style: (img.subcategory === "before" || img.subcategory === "after" ? "before-after" : "finished-result") as ImageStyle,
      season: "all-year" as ImageSeason,
      quality: 5 as 1 | 2 | 3 | 4 | 5,
      description: img.altText || img.filename,
      tags: img.tags || [],
      createdAt: img.createdAt || new Date().toISOString(),
      isUserUploaded: img.isUserUploaded ?? img.is_user_uploaded ?? false,
    }));
    
    return [...convertedDbImages, ...libraryImages];
  }, [dbImages, libraryImages]);

  // Role-specific content - different messaging for different users
  const isMarketingRole = userRole === "marketing";
  const isDeveloperRole = userRole === "developer";
  const isOwnerRole = userRole === "owner";
  const isAdminRole = userRole === "admin" || userRole === "ops_manager";
  const tenantName = selectedTenant === "npp" ? "Nashville Painting Professionals" : "Paint Pros Co";

  // Section content for voice reading (stripped of emojis) - role-specific
  const getSectionContent = (): Record<string, string> => {
    if (isMarketingRole) {
      return {
        welcome: `Hey ${userName}, here's what I built for us. This is our Marketing Hub for ${tenantName}. I've been building this system so we can run a professional marketing operation together without either of us having to spend hours on it. Below I'll walk you through what's ready, how to use it, what I'm still connecting, and where we're headed. Let's make this thing dominate.`,
        section1: `Section 1: What's Ready Right Now. We have over 100 marketing images loaded and organized, a visual content catalog where you can browse everything, a scheduling calendar to plan your posts, real-time analytics tracking with charts and metrics, and a Team Notes feature so we can leave messages for each other.`,
        section2: `Section 2: How To Operate It. Your Tasks. The system is built and ready to go. Now I need your help running it. These are your responsibilities to keep the marketing machine operating at maximum effectiveness. First, Review AI Captions: When the AI generates content, review it before it goes live. Does it sound like NPP? Your approval ensures brand voice stays consistent. Second, Spot Trends: You're on social media daily. When you see trending formats or ideas that could work for a painting company, flag them. This keeps our content fresh and relevant. Third, Monitor Engagement: Check the Analytics tab weekly. Note which posts are winning and which are underperforming. This data drives our optimization decisions. Fourth, Curate the Library: Browse the Content Catalog regularly. Flag outdated images, suggest new pairings, and keep the library fresh. Quality in equals quality out.`,
        section3: `Section 3: What I'm Still Connecting. Step 1, Manual Rotation, is current. Setting up the first content rotation manually to establish the baseline. Step 2, Meta API Connection, is in progress. Working on getting the direct API connection to Meta set up. Step 3, Full Automation, is coming next.`,
        section4: `Section 4: Where We're Headed. The Marketing AI will handle Content Suggestions, Smart Scheduling, Performance Alerts, and Ad Optimization automatically.`,
        section5: `Section 5: How We Stay In Sync. Use the Team Notes tab to leave messages. For example, you post: "Hey, updated next week's Nextdoor post." I reply: "Got it, scheduled for next week." Everyone sees the notes and stays in the loop. The goal is efficiency. The system runs like a carousel, it never stops.`,
      };
    }
    // Developer view - Marketing Director with multi-tenant access
    if (isDeveloperRole) {
      return {
        welcome: `Welcome back, ${userName}. Marketing Director view for ${tenantName}. Use the tenant switcher to manage NPP and Paint Pros marketing operations. Full access to content, analytics, scheduling, and automation across all properties.`,
        section1: `Content Library: Over 100 marketing images organized by category. AI-powered caption generation. Visual content catalog with scheduling calendar.`,
        section2: `Analytics: Real-time performance tracking, engagement metrics, and platform breakdowns. Monitor what's working across all tenants.`,
        section3: `Automation Status: Manual rotation active. Meta API integration in progress. Full automation coming soon.`,
        section4: `Roadmap: AI content suggestions, smart scheduling, performance alerts, and ad optimization.`,
        section5: `Multi-Tenant Access: Switch between NPP and Paint Pros using the tenant selector. All analytics are tenant-separated.`,
      };
    }
    // Owner and Admin view
    return {
      welcome: `Welcome back, ${userName}. You're viewing the Marketing Hub for ${tenantName}. Use the tenant switcher above to switch between NPP and Lume. This dashboard gives you visibility into marketing operations and performance.`,
      section1: `Content Library: Over 100 marketing images organized by category. AI-powered caption generation. Visual content catalog with scheduling calendar.`,
      section2: `Analytics: Real-time performance tracking, engagement metrics, and platform breakdowns. Monitor what's working across all tenants.`,
      section3: `Automation Status: Manual rotation active. Meta API integration in progress. Full automation coming soon.`,
      section4: `Roadmap: AI content suggestions, smart scheduling, performance alerts, and ad optimization.`,
      section5: `Multi-Tenant Access: Switch between NPP and Paint Pros using the tenant selector. All analytics are tenant-separated.`,
    };
  };

  const sectionContent = getSectionContent();

  // Strip emojis from text for clean voice output
  const stripEmojis = (text: string): string => {
    // Remove emojis and special characters using character class ranges
    return text
      .split('')
      .filter(char => char.charCodeAt(0) < 0x1F300 || char.charCodeAt(0) > 0x1F9FF)
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Handle text-to-speech for a section
  const handleReadSection = async (sectionId: string) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
      setIsReading(false);
      return;
    }

    const content = sectionContent[sectionId];
    if (!content) return;

    const cleanText = stripEmojis(content);
    setIsReading(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: 'alloy' }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsReading(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsReading(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      setCurrentAudio(audio);
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsReading(false);
    }
  };

  // Check for saved session on mount (30-day persistence)
  useEffect(() => {
    const savedSession = localStorage.getItem("marketing_session");
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.expiry && new Date(session.expiry) > new Date()) {
          setIsAuthenticated(true);
          setUserRole(session.role);
          setUserName(session.name);
        } else {
          // Session expired, clear it
          localStorage.removeItem("marketing_session");
        }
      } catch (e) {
        localStorage.removeItem("marketing_session");
      }
    }
  }, []);

  useEffect(() => {
    const savedPosts = localStorage.getItem("marketing_posts");
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      const initialPosts: SocialPost[] = [
        ...SAMPLE_EVERGREEN_NPP.map((p, i) => ({
          ...p,
          id: `npp-evergreen-${i}`,
          brand: "npp" as const,
          type: "evergreen" as const,
          status: "draft" as const,
          createdAt: new Date().toISOString(),
        })),
        ...SAMPLE_SEASONAL_NPP.map((p, i) => ({
          ...p,
          id: `npp-seasonal-${i}`,
          brand: "npp" as const,
          type: "seasonal" as const,
          status: "draft" as const,
          createdAt: new Date().toISOString(),
        })),
        ...SAMPLE_EVERGREEN_LUME.map((p, i) => ({
          ...p,
          id: `lume-evergreen-${i}`,
          brand: "lumepaint" as const,
          type: "evergreen" as const,
          status: "draft" as const,
          createdAt: new Date().toISOString(),
        })),
        ...SAMPLE_SEASONAL_LUME.map((p, i) => ({
          ...p,
          id: `lume-seasonal-${i}`,
          brand: "lumepaint" as const,
          type: "seasonal" as const,
          status: "draft" as const,
          createdAt: new Date().toISOString(),
        })),
      ] as SocialPost[];
      setPosts(initialPosts);
      localStorage.setItem("marketing_posts", JSON.stringify(initialPosts));
    }

    // Load DAM data
    const savedImages = localStorage.getItem("marketing_images");
    if (savedImages) {
      setLibraryImages(JSON.parse(savedImages));
    } else {
      // Full image library - 60 NPP + 60 Lume = 120 total
      const nppImages: LibraryImage[] = [
        // NPP Interior Walls (15)
        { id: "npp-int-1", brand: "npp", url: interior01Living, description: "Living room transformation - fresh white walls", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["living room", "white", "modern"], createdAt: new Date().toISOString() },
        { id: "npp-int-2", brand: "npp", url: interior09Open, description: "Modern apartment interior refresh", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["apartment", "modern", "clean"], createdAt: new Date().toISOString() },
        { id: "npp-int-3", brand: "npp", url: interior08Accent, description: "Bedroom accent wall in navy", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["bedroom", "accent wall", "navy"], createdAt: new Date().toISOString() },
        { id: "npp-int-4", brand: "npp", url: interior03Kitchen, description: "Kitchen walls bright and clean", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["kitchen", "bright", "clean"], createdAt: new Date().toISOString() },
        { id: "npp-int-5", brand: "npp", url: interior02Bedroom, description: "Master bedroom calming colors", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["bedroom", "calming", "neutral"], createdAt: new Date().toISOString() },
        { id: "npp-int-6", brand: "npp", url: interior05Office, description: "Home office professional finish", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["office", "professional", "home"], createdAt: new Date().toISOString() },
        { id: "npp-int-7", brand: "npp", url: interior02Bedroom, description: "Guest bedroom welcoming warmth", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["bedroom", "warm", "welcoming"], createdAt: new Date().toISOString() },
        { id: "npp-int-8", brand: "npp", url: interior06Bathroom, description: "Bathroom fresh paint update", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["bathroom", "fresh", "update"], createdAt: new Date().toISOString() },
        { id: "npp-int-9", brand: "npp", url: interior09Open, description: "Open concept living space", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["open concept", "living", "modern"], createdAt: new Date().toISOString() },
        { id: "npp-int-10", brand: "npp", url: interior04Dining, description: "Dining room elegant finish", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["dining", "elegant", "formal"], createdAt: new Date().toISOString() },
        { id: "npp-int-11", brand: "npp", url: interior09Open, description: "Hallway bright transformation", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["hallway", "bright", "clean"], createdAt: new Date().toISOString() },
        { id: "npp-int-12", brand: "npp", url: interior07Nursery, description: "Nursery soft colors", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["nursery", "soft", "baby"], createdAt: new Date().toISOString() },
        { id: "npp-int-13", brand: "npp", url: interior09Open, description: "Laundry room refresh", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["laundry", "clean", "bright"], createdAt: new Date().toISOString() },
        { id: "npp-int-14", brand: "npp", url: interior01Living, description: "Basement family room makeover", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["basement", "family room", "cozy"], createdAt: new Date().toISOString() },
        { id: "npp-int-15", brand: "npp", url: interior08Accent, description: "Sunroom cheerful update", subject: "interior-walls", style: "finished-result", season: "spring", quality: 5, tags: ["sunroom", "cheerful", "bright"], createdAt: new Date().toISOString() },
        // NPP Exterior (15)
        { id: "npp-ext-1", brand: "npp", url: exterior01CurbAppeal, description: "Exterior home curb appeal boost", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["exterior", "curb appeal", "home"], createdAt: new Date().toISOString() },
        { id: "npp-ext-2", brand: "npp", url: exterior02Modern, description: "Modern home exterior finish", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["modern", "exterior", "sleek"], createdAt: new Date().toISOString() },
        { id: "npp-ext-3", brand: "npp", url: exterior03Traditional, description: "Traditional home fresh paint", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["traditional", "classic", "home"], createdAt: new Date().toISOString() },
        { id: "npp-ext-4", brand: "npp", url: exterior04Luxury, description: "Luxury home exterior detail", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["luxury", "detail", "premium"], createdAt: new Date().toISOString() },
        { id: "npp-ext-5", brand: "npp", url: exterior05Suburban, description: "Suburban home transformation", subject: "exterior-home", style: "before-after", season: "summer", quality: 5, tags: ["suburban", "family", "transformation"], createdAt: new Date().toISOString() },
        { id: "npp-ext-6", brand: "npp", url: exterior06Colonial, description: "Colonial style home repaint", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 4, tags: ["colonial", "classic", "repaint"], createdAt: new Date().toISOString() },
        { id: "npp-ext-7", brand: "npp", url: exterior07Ranch, description: "Ranch home exterior update", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 4, tags: ["ranch", "single story", "update"], createdAt: new Date().toISOString() },
        { id: "npp-ext-8", brand: "npp", url: exterior08Craftsman, description: "Craftsman home character preserved", subject: "exterior-home", style: "finished-result", season: "fall", quality: 5, tags: ["craftsman", "character", "detail"], createdAt: new Date().toISOString() },
        { id: "npp-ext-9", brand: "npp", url: exterior09Twostory, description: "Two-story home complete repaint", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["two-story", "complete", "family"], createdAt: new Date().toISOString() },
        { id: "npp-ext-10", brand: "npp", url: exterior10Porch, description: "Porch and siding refresh", subject: "exterior-home", style: "finished-result", season: "spring", quality: 4, tags: ["porch", "siding", "refresh"], createdAt: new Date().toISOString() },
        { id: "npp-ext-11", brand: "npp", url: exterior12Garage, description: "Garage door and trim update", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 4, tags: ["garage", "trim", "detail"], createdAt: new Date().toISOString() },
        { id: "npp-ext-12", brand: "npp", url: door01Front, description: "Front entry makeover", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["entry", "front door", "welcoming"], createdAt: new Date().toISOString() },
        { id: "npp-ext-13", brand: "npp", url: exterior11Historic, description: "Shutters and accent colors", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 4, tags: ["shutters", "accent", "color"], createdAt: new Date().toISOString() },
        { id: "npp-ext-14", brand: "npp", url: exterior11Historic, description: "Historic home preservation", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["historic", "preservation", "classic"], createdAt: new Date().toISOString() },
        { id: "npp-ext-15", brand: "npp", url: exterior02Modern, description: "New construction final paint", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["new construction", "final", "fresh"], createdAt: new Date().toISOString() },
        // NPP Cabinets (10)
        { id: "npp-cab-1", brand: "npp", url: cabinetWhiteKitchen, description: "White kitchen cabinet refresh", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["kitchen", "white", "cabinets"], createdAt: new Date().toISOString() },
        { id: "npp-cab-2", brand: "npp", url: cabinetNavyBlue, description: "Navy blue cabinet transformation", subject: "cabinet-work", style: "before-after", season: "all-year", quality: 5, tags: ["navy", "modern", "transformation"], createdAt: new Date().toISOString() },
        { id: "npp-cab-3", brand: "npp", url: cabinetBathroomVanity, description: "Bathroom vanity update", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 4, tags: ["bathroom", "vanity", "update"], createdAt: new Date().toISOString() },
        { id: "npp-cab-4", brand: "npp", url: cabinetBuiltInShelving, description: "Built-in shelving refinish", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 4, tags: ["built-in", "shelving", "refinish"], createdAt: new Date().toISOString() },
        { id: "npp-cab-5", brand: "npp", url: cabinetLaundryRoom, description: "Laundry room cabinets bright", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 4, tags: ["laundry", "bright", "functional"], createdAt: new Date().toISOString() },
        { id: "npp-cab-6", brand: "npp", url: cabinetPantry, description: "Pantry cabinet organization", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 4, tags: ["pantry", "organization", "clean"], createdAt: new Date().toISOString() },
        { id: "npp-cab-7", brand: "npp", url: cabinetGrayKitchen, description: "Gray kitchen cabinet elegance", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["gray", "elegant", "modern"], createdAt: new Date().toISOString() },
        { id: "npp-cab-8", brand: "npp", url: cabinetTwoTone, description: "Two-tone cabinet design", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["two-tone", "design", "trendy"], createdAt: new Date().toISOString() },
        { id: "npp-cab-9", brand: "npp", url: cabinetOfficeBuiltin, description: "Office built-in cabinetry", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 4, tags: ["office", "built-in", "professional"], createdAt: new Date().toISOString() },
        { id: "npp-cab-10", brand: "npp", url: cabinetEntertainment, description: "Entertainment center refinish", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 4, tags: ["entertainment", "living room", "refinish"], createdAt: new Date().toISOString() },
        // NPP Trim/Doors (10)
        { id: "npp-trim-1", brand: "npp", url: trim01Crown, description: "Crown molding detail work", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 5, tags: ["crown molding", "detail", "elegant"], createdAt: new Date().toISOString() },
        { id: "npp-trim-2", brand: "npp", url: trim02Baseboard, description: "Baseboard refresh clean lines", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 4, tags: ["baseboard", "clean", "crisp"], createdAt: new Date().toISOString() },
        { id: "npp-trim-3", brand: "npp", url: trim01Crown, description: "Window trim precision", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 4, tags: ["window", "trim", "precision"], createdAt: new Date().toISOString() },
        { id: "npp-trim-4", brand: "npp", url: door02Interior, description: "Door frame refinish", subject: "door-painting", style: "finished-result", season: "all-year", quality: 4, tags: ["door frame", "refinish", "detail"], createdAt: new Date().toISOString() },
        { id: "npp-trim-5", brand: "npp", url: door02Interior, description: "Interior doors bold color", subject: "door-painting", style: "finished-result", season: "all-year", quality: 5, tags: ["interior doors", "bold", "statement"], createdAt: new Date().toISOString() },
        { id: "npp-trim-6", brand: "npp", url: door01Front, description: "Front door welcoming red", subject: "door-painting", style: "finished-result", season: "all-year", quality: 5, tags: ["front door", "red", "welcoming"], createdAt: new Date().toISOString() },
        { id: "npp-trim-7", brand: "npp", url: trim02Baseboard, description: "Stair railing refresh", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 4, tags: ["stairs", "railing", "refresh"], createdAt: new Date().toISOString() },
        { id: "npp-trim-8", brand: "npp", url: trim01Crown, description: "Wainscoting classic elegance", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 5, tags: ["wainscoting", "classic", "elegant"], createdAt: new Date().toISOString() },
        { id: "npp-trim-9", brand: "npp", url: door02Interior, description: "Black interior doors modern", subject: "door-painting", style: "finished-result", season: "all-year", quality: 5, tags: ["black doors", "modern", "contrast"], createdAt: new Date().toISOString() },
        { id: "npp-trim-10", brand: "npp", url: trim01Crown, description: "Fireplace mantel refinish", subject: "trim-detail", style: "finished-result", season: "fall", quality: 5, tags: ["fireplace", "mantel", "cozy"], createdAt: new Date().toISOString() },
        // NPP Commercial/General (10)
        { id: "npp-com-1", brand: "npp", url: commercial01Office, description: "Office building lobby fresh", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 5, tags: ["office", "commercial", "professional"], createdAt: new Date().toISOString() },
        { id: "npp-com-2", brand: "npp", url: commercial02Retail, description: "Retail storefront update", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 5, tags: ["retail", "storefront", "business"], createdAt: new Date().toISOString() },
        { id: "npp-com-3", brand: "npp", url: commercial01Office, description: "Restaurant interior ambiance", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 5, tags: ["restaurant", "ambiance", "dining"], createdAt: new Date().toISOString() },
        { id: "npp-com-4", brand: "npp", url: commercial02Retail, description: "Medical office clean professional", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 4, tags: ["medical", "clean", "professional"], createdAt: new Date().toISOString() },
        { id: "npp-com-5", brand: "npp", url: commercial01Office, description: "Conference room executive finish", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 5, tags: ["conference", "executive", "corporate"], createdAt: new Date().toISOString() },
        { id: "npp-gen-1", brand: "npp", url: general02Swatches, description: "Paint swatches color selection", subject: "general", style: "action-shot", season: "all-year", quality: 4, tags: ["swatches", "colors", "selection"], createdAt: new Date().toISOString() },
        { id: "npp-gen-2", brand: "npp", url: team01Crew, description: "Professional painter at work", subject: "team-action", style: "action-shot", season: "all-year", quality: 5, tags: ["painter", "professional", "work"], createdAt: new Date().toISOString() },
        { id: "npp-gen-3", brand: "npp", url: team01Crew, description: "Team collaboration on site", subject: "team-action", style: "action-shot", season: "all-year", quality: 5, tags: ["team", "collaboration", "site"], createdAt: new Date().toISOString() },
        { id: "npp-gen-4", brand: "npp", url: beforeafter01Room, description: "Before and after dramatic", subject: "before-after", style: "before-after", season: "all-year", quality: 5, tags: ["before after", "dramatic", "transformation"], createdAt: new Date().toISOString() },
        { id: "npp-gen-5", brand: "npp", url: general02Swatches, description: "Color consultation service", subject: "general", style: "action-shot", season: "all-year", quality: 4, tags: ["consultation", "color", "service"], createdAt: new Date().toISOString() },
      ];
      
      const lumeImages: LibraryImage[] = [
        // Lume Interior Walls (15)
        { id: "lume-int-1", brand: "lumepaint", url: interior01Living, description: "Elevated living space design", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["elevated", "design", "living"], createdAt: new Date().toISOString() },
        { id: "lume-int-2", brand: "lumepaint", url: interior02Bedroom, description: "Sophisticated bedroom retreat", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["sophisticated", "bedroom", "retreat"], createdAt: new Date().toISOString() },
        { id: "lume-int-3", brand: "lumepaint", url: interior09Open, description: "Minimalist aesthetic walls", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["minimalist", "aesthetic", "clean"], createdAt: new Date().toISOString() },
        { id: "lume-int-4", brand: "lumepaint", url: interior01Living, description: "Warm neutral palette living", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["warm", "neutral", "inviting"], createdAt: new Date().toISOString() },
        { id: "lume-int-5", brand: "lumepaint", url: interior02Bedroom, description: "Luxury master suite finish", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["luxury", "master suite", "premium"], createdAt: new Date().toISOString() },
        { id: "lume-int-6", brand: "lumepaint", url: interior06Bathroom, description: "Zen bathroom sanctuary", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["zen", "bathroom", "sanctuary"], createdAt: new Date().toISOString() },
        { id: "lume-int-7", brand: "lumepaint", url: interior05Office, description: "Home office inspiration", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["office", "inspiration", "productivity"], createdAt: new Date().toISOString() },
        { id: "lume-int-8", brand: "lumepaint", url: interior04Dining, description: "Dining room sophistication", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["dining", "sophisticated", "entertaining"], createdAt: new Date().toISOString() },
        { id: "lume-int-9", brand: "lumepaint", url: interior01Living, description: "Reading nook cozy corner", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["reading nook", "cozy", "corner"], createdAt: new Date().toISOString() },
        { id: "lume-int-10", brand: "lumepaint", url: interior07Nursery, description: "Kids room playful colors", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["kids", "playful", "fun"], createdAt: new Date().toISOString() },
        { id: "lume-int-11", brand: "lumepaint", url: interior08Accent, description: "Gallery wall backdrop", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["gallery", "art", "backdrop"], createdAt: new Date().toISOString() },
        { id: "lume-int-12", brand: "lumepaint", url: interior09Open, description: "Entryway first impression", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 5, tags: ["entryway", "first impression", "welcoming"], createdAt: new Date().toISOString() },
        { id: "lume-int-13", brand: "lumepaint", url: interior09Open, description: "Mudroom organized style", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["mudroom", "organized", "functional"], createdAt: new Date().toISOString() },
        { id: "lume-int-14", brand: "lumepaint", url: interior02Bedroom, description: "Closet organization upgrade", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["closet", "organization", "upgrade"], createdAt: new Date().toISOString() },
        { id: "lume-int-15", brand: "lumepaint", url: interior01Living, description: "Bonus room versatile space", subject: "interior-walls", style: "finished-result", season: "all-year", quality: 4, tags: ["bonus room", "versatile", "flexible"], createdAt: new Date().toISOString() },
        // Lume Exterior (15)
        { id: "lume-ext-1", brand: "lumepaint", url: exterior01CurbAppeal, description: "Elegant home exterior elevation", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["elegant", "elevation", "curb appeal"], createdAt: new Date().toISOString() },
        { id: "lume-ext-2", brand: "lumepaint", url: exterior02Modern, description: "Contemporary architecture paint", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["contemporary", "architecture", "modern"], createdAt: new Date().toISOString() },
        { id: "lume-ext-3", brand: "lumepaint", url: exterior07Ranch, description: "Charming cottage exterior", subject: "exterior-home", style: "finished-result", season: "spring", quality: 5, tags: ["cottage", "charming", "quaint"], createdAt: new Date().toISOString() },
        { id: "lume-ext-4", brand: "lumepaint", url: exterior08Craftsman, description: "Farmhouse style refresh", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 5, tags: ["farmhouse", "style", "rustic"], createdAt: new Date().toISOString() },
        { id: "lume-ext-5", brand: "lumepaint", url: exterior09Twostory, description: "Mediterranean villa tones", subject: "exterior-home", style: "finished-result", season: "summer", quality: 5, tags: ["mediterranean", "villa", "warm"], createdAt: new Date().toISOString() },
        { id: "lume-ext-6", brand: "lumepaint", url: exterior05Suburban, description: "Beach house coastal colors", subject: "exterior-home", style: "finished-result", season: "summer", quality: 5, tags: ["beach", "coastal", "relaxed"], createdAt: new Date().toISOString() },
        { id: "lume-ext-7", brand: "lumepaint", url: exterior06Colonial, description: "Mountain retreat exterior", subject: "exterior-home", style: "finished-result", season: "fall", quality: 5, tags: ["mountain", "retreat", "nature"], createdAt: new Date().toISOString() },
        { id: "lume-ext-8", brand: "lumepaint", url: exterior11Historic, description: "Urban townhome update", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 4, tags: ["urban", "townhome", "city"], createdAt: new Date().toISOString() },
        { id: "lume-ext-9", brand: "lumepaint", url: exterior03Traditional, description: "Lakefront property beauty", subject: "exterior-home", style: "finished-result", season: "summer", quality: 5, tags: ["lakefront", "waterfront", "scenic"], createdAt: new Date().toISOString() },
        { id: "lume-ext-10", brand: "lumepaint", url: exterior12Garage, description: "Garden shed charming update", subject: "exterior-home", style: "finished-result", season: "spring", quality: 4, tags: ["shed", "garden", "charming"], createdAt: new Date().toISOString() },
        { id: "lume-ext-11", brand: "lumepaint", url: exterior10Porch, description: "Fence and gate refresh", subject: "exterior-home", style: "finished-result", season: "all-year", quality: 4, tags: ["fence", "gate", "boundary"], createdAt: new Date().toISOString() },
        { id: "lume-ext-12", brand: "lumepaint", url: deck01Backyard, description: "Pergola outdoor living", subject: "deck-staining", style: "finished-result", season: "summer", quality: 5, tags: ["pergola", "outdoor", "entertainment"], createdAt: new Date().toISOString() },
        { id: "lume-ext-13", brand: "lumepaint", url: exterior04Luxury, description: "Pool house cabana style", subject: "exterior-home", style: "finished-result", season: "summer", quality: 5, tags: ["pool house", "cabana", "resort"], createdAt: new Date().toISOString() },
        { id: "lume-ext-14", brand: "lumepaint", url: exterior05Suburban, description: "Greenhouse glass and trim", subject: "exterior-home", style: "finished-result", season: "spring", quality: 4, tags: ["greenhouse", "garden", "botanical"], createdAt: new Date().toISOString() },
        { id: "lume-ext-15", brand: "lumepaint", url: exterior01CurbAppeal, description: "Outdoor kitchen setup", subject: "exterior-home", style: "finished-result", season: "summer", quality: 5, tags: ["outdoor kitchen", "cooking", "entertaining"], createdAt: new Date().toISOString() },
        // Lume Cabinets (10)
        { id: "lume-cab-1", brand: "lumepaint", url: cabinetWhiteKitchen, description: "Designer kitchen cabinets", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["designer", "kitchen", "luxury"], createdAt: new Date().toISOString() },
        { id: "lume-cab-2", brand: "lumepaint", url: cabinetGrayKitchen, description: "Sage green cabinet trend", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["sage", "green", "trendy"], createdAt: new Date().toISOString() },
        { id: "lume-cab-3", brand: "lumepaint", url: cabinetBathroomVanity, description: "Bathroom double vanity luxury", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["double vanity", "luxury", "spa"], createdAt: new Date().toISOString() },
        { id: "lume-cab-4", brand: "lumepaint", url: cabinetPantry, description: "Butler pantry organization", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["butler pantry", "organization", "luxury"], createdAt: new Date().toISOString() },
        { id: "lume-cab-5", brand: "lumepaint", url: cabinetNavyBlue, description: "Wet bar cabinet elegance", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["wet bar", "entertaining", "elegant"], createdAt: new Date().toISOString() },
        { id: "lume-cab-6", brand: "lumepaint", url: cabinetBuiltInShelving, description: "Walk-in closet built-ins", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["closet", "built-in", "luxury"], createdAt: new Date().toISOString() },
        { id: "lume-cab-7", brand: "lumepaint", url: cabinetOfficeBuiltin, description: "Library shelving classic", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["library", "shelving", "classic"], createdAt: new Date().toISOString() },
        { id: "lume-cab-8", brand: "lumepaint", url: cabinetTwoTone, description: "Wine cellar cabinetry", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["wine cellar", "storage", "luxury"], createdAt: new Date().toISOString() },
        { id: "lume-cab-9", brand: "lumepaint", url: cabinetLaundryRoom, description: "Craft room storage solution", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 4, tags: ["craft room", "storage", "creative"], createdAt: new Date().toISOString() },
        { id: "lume-cab-10", brand: "lumepaint", url: cabinetEntertainment, description: "Media room cabinet design", subject: "cabinet-work", style: "finished-result", season: "all-year", quality: 5, tags: ["media room", "entertainment", "design"], createdAt: new Date().toISOString() },
        // Lume Trim/Doors (10)
        { id: "lume-trim-1", brand: "lumepaint", url: trim01Crown, description: "Architectural molding detail", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 5, tags: ["architectural", "molding", "detail"], createdAt: new Date().toISOString() },
        { id: "lume-trim-2", brand: "lumepaint", url: trim02Baseboard, description: "Custom millwork finishing", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 5, tags: ["custom", "millwork", "craftsmanship"], createdAt: new Date().toISOString() },
        { id: "lume-trim-3", brand: "lumepaint", url: door01Front, description: "French door elegance", subject: "door-painting", style: "finished-result", season: "all-year", quality: 5, tags: ["french doors", "elegant", "glass"], createdAt: new Date().toISOString() },
        { id: "lume-trim-4", brand: "lumepaint", url: door01Front, description: "Statement entry door", subject: "door-painting", style: "finished-result", season: "all-year", quality: 5, tags: ["entry", "statement", "grand"], createdAt: new Date().toISOString() },
        { id: "lume-trim-5", brand: "lumepaint", url: door02Interior, description: "Barn door rustic charm", subject: "door-painting", style: "finished-result", season: "all-year", quality: 5, tags: ["barn door", "rustic", "charm"], createdAt: new Date().toISOString() },
        { id: "lume-trim-6", brand: "lumepaint", url: trim01Crown, description: "Grand staircase railing", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 5, tags: ["staircase", "grand", "elegant"], createdAt: new Date().toISOString() },
        { id: "lume-trim-7", brand: "lumepaint", url: trim02Baseboard, description: "Coffered ceiling luxury", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 5, tags: ["coffered ceiling", "luxury", "architectural"], createdAt: new Date().toISOString() },
        { id: "lume-trim-8", brand: "lumepaint", url: door02Interior, description: "Pocket doors space saving", subject: "door-painting", style: "finished-result", season: "all-year", quality: 4, tags: ["pocket doors", "space saving", "modern"], createdAt: new Date().toISOString() },
        { id: "lume-trim-9", brand: "lumepaint", url: trim01Crown, description: "Picture frame wall panels", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 5, tags: ["wall panels", "picture frame", "elegant"], createdAt: new Date().toISOString() },
        { id: "lume-trim-10", brand: "lumepaint", url: trim02Baseboard, description: "Shiplap accent wall", subject: "trim-detail", style: "finished-result", season: "all-year", quality: 5, tags: ["shiplap", "accent", "texture"], createdAt: new Date().toISOString() },
        // Lume Commercial/General (10)
        { id: "lume-com-1", brand: "lumepaint", url: commercial01Office, description: "Boutique hotel lobby", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 5, tags: ["hotel", "boutique", "luxury"], createdAt: new Date().toISOString() },
        { id: "lume-com-2", brand: "lumepaint", url: commercial02Retail, description: "Upscale salon interior", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 5, tags: ["salon", "upscale", "beauty"], createdAt: new Date().toISOString() },
        { id: "lume-com-3", brand: "lumepaint", url: commercial01Office, description: "Fine dining atmosphere", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 5, tags: ["fine dining", "atmosphere", "elegant"], createdAt: new Date().toISOString() },
        { id: "lume-com-4", brand: "lumepaint", url: commercial02Retail, description: "Spa wellness center", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 5, tags: ["spa", "wellness", "relaxation"], createdAt: new Date().toISOString() },
        { id: "lume-com-5", brand: "lumepaint", url: commercial01Office, description: "Art gallery exhibition space", subject: "commercial-space", style: "finished-result", season: "all-year", quality: 5, tags: ["gallery", "art", "exhibition"], createdAt: new Date().toISOString() },
        { id: "lume-gen-1", brand: "lumepaint", url: general02Swatches, description: "Curated color palette", subject: "general", style: "action-shot", season: "all-year", quality: 5, tags: ["curated", "palette", "design"], createdAt: new Date().toISOString() },
        { id: "lume-gen-2", brand: "lumepaint", url: team01Crew, description: "Artisan craftsman at work", subject: "team-action", style: "action-shot", season: "all-year", quality: 5, tags: ["artisan", "craftsman", "skill"], createdAt: new Date().toISOString() },
        { id: "lume-gen-3", brand: "lumepaint", url: team01Crew, description: "Expert team precision", subject: "team-action", style: "action-shot", season: "all-year", quality: 5, tags: ["expert", "precision", "team"], createdAt: new Date().toISOString() },
        { id: "lume-gen-4", brand: "lumepaint", url: beforeafter01Room, description: "Stunning transformation reveal", subject: "before-after", style: "before-after", season: "all-year", quality: 5, tags: ["transformation", "reveal", "stunning"], createdAt: new Date().toISOString() },
        { id: "lume-gen-5", brand: "lumepaint", url: general02Swatches, description: "Design consultation session", subject: "general", style: "action-shot", season: "all-year", quality: 5, tags: ["design", "consultation", "expert"], createdAt: new Date().toISOString() },
      ];
      
      const allImages = [...nppImages, ...lumeImages];
      setLibraryImages(allImages);
      localStorage.setItem("marketing_images", JSON.stringify(allImages));
    }
    
    const savedMessages = localStorage.getItem("marketing_messages");
    if (savedMessages) {
      setMessageTemplates(JSON.parse(savedMessages));
    } else {
      // Full message library - 60 NPP + 60 Lume = 120 total
      // NPP tagline: "Transforming familiar spaces into extraordinary places."
      // Lume tagline: "We elevate the backdrop of your life."
      const nppMessages: MessageTemplate[] = [
        // NPP Facebook (10)
        { id: "npp-fb-1", brand: "npp", platform: "facebook", content: "Transforming familiar spaces into extraordinary places - that's what we do best! Ready to see your home in a whole new light? Get your free estimate today.", subject: "interior-walls", tone: "professional", cta: "get-quote", hashtags: ["#NashvillePainting", "#HomeTransformation", "#NPP"], createdAt: new Date().toISOString() },
        { id: "npp-fb-2", brand: "npp", platform: "facebook", content: "Your living room deserves to be extraordinary! We transform familiar spaces with expert craftsmanship and premium paints. Message us for a free consultation.", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: ["#LivingRoomMakeover", "#NashvilleHomes", "#PaintPros"], createdAt: new Date().toISOString() },
        { id: "npp-fb-3", brand: "npp", platform: "facebook", content: "From ordinary to extraordinary - watch how we transform this Nashville home's exterior! Curb appeal that makes neighbors jealous.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#CurbAppeal", "#ExteriorPainting", "#BeforeAndAfter"], createdAt: new Date().toISOString() },
        { id: "npp-fb-4", brand: "npp", platform: "facebook", content: "Kitchen cabinets looking tired? We transform familiar kitchens into extraordinary gathering spaces. Cabinet refinishing done right!", subject: "cabinet-work", tone: "friendly", cta: "get-quote", hashtags: ["#KitchenRenovation", "#CabinetPainting", "#NashvilleKitchens"], createdAt: new Date().toISOString() },
        { id: "npp-fb-5", brand: "npp", platform: "facebook", content: "Spring is here! Time to transform your home's exterior from familiar to extraordinary. Book your exterior painting project now.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#SpringPainting", "#NashvilleSpring", "#ExteriorRefresh"], createdAt: new Date().toISOString() },
        { id: "npp-fb-6", brand: "npp", platform: "facebook", content: "That accent wall you've been dreaming about? Let's make it extraordinary! We help Nashville homeowners transform their spaces every day.", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: ["#AccentWall", "#InteriorDesign", "#ColorInspiration"], createdAt: new Date().toISOString() },
        { id: "npp-fb-7", brand: "npp", platform: "facebook", content: "Commercial spaces deserve the extraordinary treatment too! We transform Nashville businesses with professional painting services.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#CommercialPainting", "#NashvilleBusiness", "#ProfessionalPainters"], createdAt: new Date().toISOString() },
        { id: "npp-fb-8", brand: "npp", platform: "facebook", content: "Trim and doors make all the difference! Transform familiar details into extraordinary finishing touches. Precision painting at its finest.", subject: "trim-detail", tone: "professional", cta: "get-quote", hashtags: ["#TrimPainting", "#AttentionToDetail", "#FinishingTouches"], createdAt: new Date().toISOString() },
        { id: "npp-fb-9", brand: "npp", platform: "facebook", content: "Another Nashville family thrilled with their transformed space! Thank you for letting us turn your familiar home into something extraordinary.", subject: "general", tone: "friendly", cta: "call-us", hashtags: ["#HappyCustomers", "#NashvilleLiving", "#HomeGoals"], createdAt: new Date().toISOString() },
        { id: "npp-fb-10", brand: "npp", platform: "facebook", content: "Fall colors outside, fresh colors inside! Transform your familiar spaces before the holidays. Book now for priority scheduling.", subject: "interior-walls", tone: "professional", cta: "get-quote", hashtags: ["#FallPainting", "#HolidayReady", "#InteriorRefresh"], createdAt: new Date().toISOString() },
        // NPP Instagram (10)
        { id: "npp-ig-1", brand: "npp", platform: "instagram", content: "Transforming familiar spaces into extraordinary places. One brush stroke at a time.", subject: "interior-walls", tone: "professional", cta: "call-us", hashtags: ["#NashvillePainting", "#InteriorDesign", "#HomeTransformation", "#PaintLife", "#NPP"], createdAt: new Date().toISOString() },
        { id: "npp-ig-2", brand: "npp", platform: "instagram", content: "Before ➡️ After. The extraordinary transformation you've been waiting for. DM for your free estimate!", subject: "before-after", tone: "friendly", cta: "get-quote", hashtags: ["#BeforeAndAfter", "#TransformationTuesday", "#PaintMakeover", "#NashvilleHomes"], createdAt: new Date().toISOString() },
        { id: "npp-ig-3", brand: "npp", platform: "instagram", content: "Extraordinary curb appeal starts here. Nashville's trusted exterior painting experts.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#CurbAppeal", "#ExteriorPainting", "#NashvilleRealEstate", "#HomeExterior"], createdAt: new Date().toISOString() },
        { id: "npp-ig-4", brand: "npp", platform: "instagram", content: "Cabinet goals achieved. Another familiar kitchen transformed into something extraordinary.", subject: "cabinet-work", tone: "friendly", cta: "call-us", hashtags: ["#CabinetGoals", "#KitchenInspo", "#PaintedCabinets", "#KitchenDesign"], createdAt: new Date().toISOString() },
        { id: "npp-ig-5", brand: "npp", platform: "instagram", content: "The details make it extraordinary. Precision trim work that elevates every room.", subject: "trim-detail", tone: "professional", cta: "get-quote", hashtags: ["#TrimWork", "#Craftsmanship", "#PaintingDetails", "#QualityMatters"], createdAt: new Date().toISOString() },
        { id: "npp-ig-6", brand: "npp", platform: "instagram", content: "Your bedroom should be your sanctuary. Let us transform it into something extraordinary.", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: ["#BedroomDesign", "#SanctuarySpace", "#RelaxingColors", "#HomeVibes"], createdAt: new Date().toISOString() },
        { id: "npp-ig-7", brand: "npp", platform: "instagram", content: "Team NPP making extraordinary happen! Our crew takes pride in every project.", subject: "team-action", tone: "professional", cta: "call-us", hashtags: ["#TeamNPP", "#PaintCrew", "#ProfessionalPainters", "#AtWork"], createdAt: new Date().toISOString() },
        { id: "npp-ig-8", brand: "npp", platform: "instagram", content: "Bold color, extraordinary results. Don't be afraid to make a statement!", subject: "interior-walls", tone: "friendly", cta: "get-quote", hashtags: ["#BoldColors", "#StatementWall", "#ColorConfidence", "#InteriorInspo"], createdAt: new Date().toISOString() },
        { id: "npp-ig-9", brand: "npp", platform: "instagram", content: "Nashville businesses deserve extraordinary. Commercial painting done right.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#CommercialPainting", "#NashvilleBusiness", "#ProfessionalSpace", "#BusinessGoals"], createdAt: new Date().toISOString() },
        { id: "npp-ig-10", brand: "npp", platform: "instagram", content: "Weekend project complete! Another familiar space transformed. What's your next project?", subject: "general", tone: "friendly", cta: "call-us", hashtags: ["#WeekendProject", "#HomeImprovement", "#DIYInspiration", "#PaintPros"], createdAt: new Date().toISOString() },
        // NPP Nextdoor (15)
        { id: "npp-nd-1", brand: "npp", platform: "nextdoor", content: "Hi neighbors! Nashville Painting Professionals here. We specialize in transforming familiar spaces into extraordinary places. Looking for a reliable painter in the area? We'd love to help with your next project. Free estimates for all neighbors!", subject: "general", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-2", brand: "npp", platform: "nextdoor", content: "Spring painting season is here, neighbors! If you're thinking about refreshing your home's exterior, we're booking now. We transform familiar Nashville homes into extraordinary ones. Message us for a free estimate!", subject: "exterior-home", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-3", brand: "npp", platform: "nextdoor", content: "Just finished a beautiful interior project in the neighborhood! Love seeing familiar spaces become extraordinary. If you're considering painting, we offer free color consultations and estimates.", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-4", brand: "npp", platform: "nextdoor", content: "Neighbors - tired of those outdated kitchen cabinets? Cabinet painting is a budget-friendly way to transform your familiar kitchen into something extraordinary. Happy to provide a free quote!", subject: "cabinet-work", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-5", brand: "npp", platform: "nextdoor", content: "Thank you to all our neighbors who've trusted us with their homes! We love transforming familiar spaces into extraordinary places right here in our community.", subject: "general", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-6", brand: "npp", platform: "nextdoor", content: "Looking for a painter recommendation? Nashville Painting Professionals has served this neighborhood for years. We transform familiar homes into extraordinary ones with quality work and fair prices.", subject: "general", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-7", brand: "npp", platform: "nextdoor", content: "Neighbors! Before the summer heat hits, now is the perfect time for exterior painting. We can transform your familiar home's curb appeal into something extraordinary. Free estimates!", subject: "exterior-home", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-8", brand: "npp", platform: "nextdoor", content: "Holiday prep tip from your neighborhood painters: A fresh coat of paint transforms familiar spaces into extraordinary gathering spots. We still have openings before Thanksgiving!", subject: "interior-walls", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-9", brand: "npp", platform: "nextdoor", content: "Small business Saturday shoutout! Nashville Painting Professionals is proud to serve our neighbors. We transform familiar spaces into extraordinary places - one home at a time.", subject: "general", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-10", brand: "npp", platform: "nextdoor", content: "Thinking about selling? Fresh paint is the #1 ROI improvement! Let us help transform your familiar home into an extraordinary listing. Free estimates for neighbors.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-11", brand: "npp", platform: "nextdoor", content: "New to the neighborhood? Welcome! Nashville Painting Professionals can help make your new house feel like home. We transform familiar spaces into extraordinary ones.", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-12", brand: "npp", platform: "nextdoor", content: "Deck staining season is here! Protect your investment and transform that weathered deck into an extraordinary outdoor living space. Neighbor discounts available!", subject: "deck-staining", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-13", brand: "npp", platform: "nextdoor", content: "Interior painting during winter? Absolutely! We can transform your familiar indoor spaces into extraordinary rooms while it's too cold for exterior work.", subject: "interior-walls", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-14", brand: "npp", platform: "nextdoor", content: "Need a commercial painter? Nashville Painting Professionals handles businesses too. We transform familiar commercial spaces into extraordinary professional environments.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-nd-15", brand: "npp", platform: "nextdoor", content: "Neighbors, we're offering free color consultations this month! Not sure what color to choose? Let us help you envision your familiar space as something extraordinary.", subject: "general", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        // NPP Twitter/X (10)
        { id: "npp-tw-1", brand: "npp", platform: "x", content: "Transforming familiar spaces into extraordinary places. That's the NPP difference. #NashvillePainting", subject: "general", tone: "professional", cta: "get-quote", hashtags: ["#NashvillePainting", "#HomeImprovement"], createdAt: new Date().toISOString() },
        { id: "npp-tw-2", brand: "npp", platform: "x", content: "Before: familiar. After: extraordinary. Another Nashville home transformed! #BeforeAndAfter", subject: "before-after", tone: "friendly", cta: "call-us", hashtags: ["#BeforeAndAfter", "#PaintTransformation"], createdAt: new Date().toISOString() },
        { id: "npp-tw-3", brand: "npp", platform: "x", content: "Curb appeal that turns heads. Transforming Nashville exteriors from familiar to extraordinary. Free estimates!", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#CurbAppeal", "#ExteriorPainting"], createdAt: new Date().toISOString() },
        { id: "npp-tw-4", brand: "npp", platform: "x", content: "Cabinet painting = kitchen transformation. From familiar to extraordinary on any budget.", subject: "cabinet-work", tone: "friendly", cta: "get-quote", hashtags: ["#KitchenGoals", "#CabinetPainting"], createdAt: new Date().toISOString() },
        { id: "npp-tw-5", brand: "npp", platform: "x", content: "It's in the details. Extraordinary trim work that makes familiar spaces special. #Craftsmanship", subject: "trim-detail", tone: "professional", cta: "call-us", hashtags: ["#Craftsmanship", "#TrimWork"], createdAt: new Date().toISOString() },
        { id: "npp-tw-6", brand: "npp", platform: "x", content: "Spring = painting season! Ready to transform your familiar space? Let's talk extraordinary. #SpringRefresh", subject: "general", tone: "friendly", cta: "get-quote", hashtags: ["#SpringRefresh", "#HomeMakeover"], createdAt: new Date().toISOString() },
        { id: "npp-tw-7", brand: "npp", platform: "x", content: "Nashville businesses trust NPP for extraordinary commercial painting. Professional spaces deserve professional painters.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#CommercialPainting", "#NashvilleBusiness"], createdAt: new Date().toISOString() },
        { id: "npp-tw-8", brand: "npp", platform: "x", content: "Color confidence looks good on you. Let us help transform familiar to extraordinary. #ColorConsultation", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: ["#ColorConsultation", "#InteriorDesign"], createdAt: new Date().toISOString() },
        { id: "npp-tw-9", brand: "npp", platform: "x", content: "Another happy Nashville homeowner! We love transforming familiar spaces. Thanks for trusting NPP!", subject: "general", tone: "friendly", cta: "call-us", hashtags: ["#HappyCustomers", "#NashvilleLiving"], createdAt: new Date().toISOString() },
        { id: "npp-tw-10", brand: "npp", platform: "x", content: "Bold moves = extraordinary results. Don't fear the color! #StatementWalls #PaintPros", subject: "interior-walls", tone: "friendly", cta: "get-quote", hashtags: ["#StatementWalls", "#BoldColors"], createdAt: new Date().toISOString() },
        // NPP LinkedIn (10)
        { id: "npp-li-1", brand: "npp", platform: "linkedin", content: "At Nashville Painting Professionals, we believe every space has extraordinary potential. Our mission is transforming familiar spaces into extraordinary places through expert craftsmanship, premium materials, and exceptional service. Connect with us to discuss your next project.", subject: "general", tone: "professional", cta: "call-us", hashtags: ["#NashvilleBusiness", "#ProfessionalPainting", "#QualityCraftsmanship"], createdAt: new Date().toISOString() },
        { id: "npp-li-2", brand: "npp", platform: "linkedin", content: "Commercial spaces reflect your brand. Nashville Painting Professionals transforms familiar office environments into extraordinary professional spaces. From lobbies to conference rooms, we deliver results that impress clients and motivate teams.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#CommercialPainting", "#OfficeDesign", "#BusinessImage"], createdAt: new Date().toISOString() },
        { id: "npp-li-3", brand: "npp", platform: "linkedin", content: "Property managers: Maximize your ROI with professional painting services. We transform familiar rental properties into extraordinary spaces that command top dollar. Volume discounts available.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#PropertyManagement", "#RealEstateInvesting", "#ROI"], createdAt: new Date().toISOString() },
        { id: "npp-li-4", brand: "npp", platform: "linkedin", content: "Our team is growing! Nashville Painting Professionals is hiring experienced painters who share our passion for transforming familiar spaces into extraordinary places. DM for details.", subject: "team-action", tone: "professional", cta: "call-us", hashtags: ["#NowHiring", "#NashvilleJobs", "#PaintingCareers"], createdAt: new Date().toISOString() },
        { id: "npp-li-5", brand: "npp", platform: "linkedin", content: "Case study: How we transformed a dated Nashville office building into an extraordinary modern workspace. Fresh paint, satisfied tenants, increased property value. That's the NPP difference.", subject: "commercial-space", tone: "professional", cta: "call-us", hashtags: ["#CaseStudy", "#CommercialRealEstate", "#PropertyValue"], createdAt: new Date().toISOString() },
        { id: "npp-li-6", brand: "npp", platform: "linkedin", content: "Attention Nashville realtors: Stage homes for success with professional painting. We transform familiar listings into extraordinary properties that sell faster. Realtor referral program available.", subject: "general", tone: "professional", cta: "get-quote", hashtags: ["#RealEstate", "#HomeSelling", "#StagingTips"], createdAt: new Date().toISOString() },
        { id: "npp-li-7", brand: "npp", platform: "linkedin", content: "Quality, reliability, expertise. Nashville Painting Professionals has built our reputation on transforming familiar spaces into extraordinary places for over a decade. Partner with us for your next project.", subject: "general", tone: "professional", cta: "call-us", hashtags: ["#QualityService", "#TrustedContractor", "#NashvillePros"], createdAt: new Date().toISOString() },
        { id: "npp-li-8", brand: "npp", platform: "linkedin", content: "Restaurant owners: First impressions matter. Our commercial painting services transform familiar dining spaces into extraordinary customer experiences. Health-code compliant, minimal downtime.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#RestaurantDesign", "#HospitalityIndustry", "#CustomerExperience"], createdAt: new Date().toISOString() },
        { id: "npp-li-9", brand: "npp", platform: "linkedin", content: "HOA managers: Maintain property values with professional exterior painting. Nashville Painting Professionals transforms familiar communities into extraordinary neighborhoods. Volume pricing available.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#HOAManagement", "#PropertyMaintenance", "#CommunityLiving"], createdAt: new Date().toISOString() },
        { id: "npp-li-10", brand: "npp", platform: "linkedin", content: "Proud to serve Nashville's business community. Every project we complete represents our commitment to transforming familiar commercial spaces into extraordinary professional environments.", subject: "commercial-space", tone: "professional", cta: "call-us", hashtags: ["#NashvilleBusiness", "#CommercialServices", "#ProfessionalExcellence"], createdAt: new Date().toISOString() },
        // NPP Google Business (5)
        { id: "npp-gb-1", brand: "npp", platform: "google", content: "Nashville Painting Professionals transforms familiar spaces into extraordinary places! Serving Nashville and surrounding areas with premium interior and exterior painting services. Call today for your free estimate.", subject: "general", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-gb-2", brand: "npp", platform: "google", content: "Spring special! Book your exterior painting project now and transform your familiar home into something extraordinary. Licensed, insured, and trusted by Nashville homeowners.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-gb-3", brand: "npp", platform: "google", content: "Cabinet painting transforms kitchens! Nashville Painting Professionals turns familiar, dated cabinets into extraordinary focal points. Free estimates available.", subject: "cabinet-work", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-gb-4", brand: "npp", platform: "google", content: "Commercial painting experts serving Nashville businesses. Transform your familiar workspace into an extraordinary professional environment. Contact us for a free consultation.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "npp-gb-5", brand: "npp", platform: "google", content: "Thank you Nashville for trusting us with your homes! We love transforming familiar spaces into extraordinary places. See our 5-star reviews and call for your free estimate today.", subject: "general", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
      ];
      
      const lumeMessages: MessageTemplate[] = [
        // Lume Facebook (10)
        { id: "lume-fb-1", brand: "lumepaint", platform: "facebook", content: "We elevate the backdrop of your life. Every wall tells a story - let us help you tell yours with the perfect colors. Schedule your complimentary color consultation today.", subject: "interior-walls", tone: "professional", cta: "call-us", hashtags: ["#PaintProsCo", "#ElevateYourSpace", "#ColorStory"], createdAt: new Date().toISOString() },
        { id: "lume-fb-2", brand: "lumepaint", platform: "facebook", content: "Elevating the backdrop of your life means attention to every detail. Our artisan painters bring expertise and passion to every project. Experience the Paint Pros difference.", subject: "general", tone: "professional", cta: "get-quote", hashtags: ["#ArtisanPainting", "#PaintProsQuality", "#ElevatedLiving"], createdAt: new Date().toISOString() },
        { id: "lume-fb-3", brand: "lumepaint", platform: "facebook", content: "Your home's exterior is the first chapter of your story. We elevate curb appeal to an art form. Discover what's possible with Paint Pros Co.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#CurbAppeal", "#ExteriorDesign", "#FirstImpressions"], createdAt: new Date().toISOString() },
        { id: "lume-fb-4", brand: "lumepaint", platform: "facebook", content: "Kitchen dreams realized. We elevate the backdrop of your culinary life with stunning cabinet transformations. Luxury results, thoughtful process.", subject: "cabinet-work", tone: "friendly", cta: "call-us", hashtags: ["#LuxuryKitchen", "#CabinetDesign", "#KitchenGoals"], createdAt: new Date().toISOString() },
        { id: "lume-fb-5", brand: "lumepaint", platform: "facebook", content: "Spring awakening for your home. Elevate the backdrop of your life with fresh colors that inspire. Now booking spring consultations.", subject: "interior-walls", tone: "professional", cta: "get-quote", hashtags: ["#SpringDesign", "#FreshStart", "#ColorInspiration"], createdAt: new Date().toISOString() },
        { id: "lume-fb-6", brand: "lumepaint", platform: "facebook", content: "The art of the accent wall. We elevate familiar rooms into extraordinary spaces with strategic color placement. Let's design your statement.", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: ["#AccentWall", "#DesignStatement", "#InteriorArt"], createdAt: new Date().toISOString() },
        { id: "lume-fb-7", brand: "lumepaint", platform: "facebook", content: "Elevating commercial spaces to match your brand's excellence. Paint Pros Co brings boutique attention to businesses that demand the best.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#CommercialDesign", "#BrandExperience", "#LuxuryCommercial"], createdAt: new Date().toISOString() },
        { id: "lume-fb-8", brand: "lumepaint", platform: "facebook", content: "Millwork and trim define a space. We elevate these details with precision craftsmanship that speaks to quality. Every line matters.", subject: "trim-detail", tone: "professional", cta: "get-quote", hashtags: ["#Millwork", "#TrimDetails", "#Craftsmanship"], createdAt: new Date().toISOString() },
        { id: "lume-fb-9", brand: "lumepaint", platform: "facebook", content: "Another beautiful project complete! Thank you for letting us elevate the backdrop of your life. Your trust means everything to our team.", subject: "general", tone: "friendly", cta: "call-us", hashtags: ["#ClientLove", "#ProjectComplete", "#GratefulTeam"], createdAt: new Date().toISOString() },
        { id: "lume-fb-10", brand: "lumepaint", platform: "facebook", content: "Holiday entertaining deserves an elevated backdrop. Still time to refresh your spaces before guests arrive. Inquire about our priority scheduling.", subject: "interior-walls", tone: "professional", cta: "get-quote", hashtags: ["#HolidayReady", "#EntertainingSpaces", "#HomeForTheHolidays"], createdAt: new Date().toISOString() },
        // Lume Instagram (10)
        { id: "lume-ig-1", brand: "lumepaint", platform: "instagram", content: "Elevating the backdrop of your life. One beautiful space at a time.", subject: "interior-walls", tone: "professional", cta: "call-us", hashtags: ["#PaintProsCo", "#ElevatedLiving", "#InteriorDesign", "#LuxuryHome", "#ColorPerfection"], createdAt: new Date().toISOString() },
        { id: "lume-ig-2", brand: "lumepaint", platform: "instagram", content: "Before ➡️ After. Elevation complete. DM for your consultation.", subject: "before-after", tone: "friendly", cta: "get-quote", hashtags: ["#Transformation", "#BeforeAfter", "#ElevatedDesign", "#PaintProsResults"], createdAt: new Date().toISOString() },
        { id: "lume-ig-3", brand: "lumepaint", platform: "instagram", content: "Curb appeal, elevated. Your home deserves to make a statement.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#ExteriorGoals", "#CurbAppeal", "#HomeExterior", "#ElevatedCurb"], createdAt: new Date().toISOString() },
        { id: "lume-ig-4", brand: "lumepaint", platform: "instagram", content: "Cabinet dreams, realized. Elevating kitchens to art form status.", subject: "cabinet-work", tone: "friendly", cta: "call-us", hashtags: ["#KitchenDesign", "#CabinetGoals", "#LuxuryKitchen", "#ElevatedCooking"], createdAt: new Date().toISOString() },
        { id: "lume-ig-5", brand: "lumepaint", platform: "instagram", content: "Details define luxury. Trim work that elevates every room.", subject: "trim-detail", tone: "professional", cta: "get-quote", hashtags: ["#LuxuryDetails", "#TrimWork", "#Craftsmanship", "#ElevatedFinishes"], createdAt: new Date().toISOString() },
        { id: "lume-ig-6", brand: "lumepaint", platform: "instagram", content: "Your sanctuary awaits. We elevate bedrooms to retreat status.", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: ["#BedroomGoals", "#SanctuarySpace", "#RestfulDesign", "#ElevatedRest"], createdAt: new Date().toISOString() },
        { id: "lume-ig-7", brand: "lumepaint", platform: "instagram", content: "The Paint Pros team in action. Elevating spaces with passion and precision.", subject: "team-action", tone: "professional", cta: "call-us", hashtags: ["#TeamPaintPros", "#ArtisansAtWork", "#Craftsmanship", "#PaintPros"], createdAt: new Date().toISOString() },
        { id: "lume-ig-8", brand: "lumepaint", platform: "instagram", content: "Color speaks. Let us help you find your voice. Elevate your expression.", subject: "general", tone: "friendly", cta: "get-quote", hashtags: ["#ColorStory", "#DesignVoice", "#ElevatedExpression", "#ColorConsulting"], createdAt: new Date().toISOString() },
        { id: "lume-ig-9", brand: "lumepaint", platform: "instagram", content: "Commercial spaces elevated. Where business meets beautiful design.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#CommercialDesign", "#ElevatedBusiness", "#LuxuryCommercial", "#DesignForward"], createdAt: new Date().toISOString() },
        { id: "lume-ig-10", brand: "lumepaint", platform: "instagram", content: "Weekend transformation complete. Another backdrop elevated. What's your vision?", subject: "general", tone: "friendly", cta: "call-us", hashtags: ["#WeekendProject", "#Transformation", "#ElevatedSpaces", "#DesignDreams"], createdAt: new Date().toISOString() },
        // Lume Nextdoor (15)
        { id: "lume-nd-1", brand: "lumepaint", platform: "nextdoor", content: "Hello neighbors! Paint Pros Co here. We specialize in elevating the backdrop of your life through expert painting services. Looking for a painter who treats your home like a work of art? We'd love to meet you.", subject: "general", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-2", brand: "lumepaint", platform: "nextdoor", content: "Spring is the perfect time to elevate your home's exterior. Paint Pros Co is now booking exterior projects. We bring boutique attention and premium results to every home.", subject: "exterior-home", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-3", brand: "lumepaint", platform: "nextdoor", content: "Just completed a beautiful interior project nearby! We love elevating the backdrop of our neighbors' lives. Complimentary color consultations available.", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-4", brand: "lumepaint", platform: "nextdoor", content: "Neighbors - considering cabinet painting? It's the most impactful kitchen upgrade you can make. Paint Pros Co elevates kitchens with precision and care. Happy to provide a consultation!", subject: "cabinet-work", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-5", brand: "lumepaint", platform: "nextdoor", content: "Thank you to all the neighbors who've welcomed us into your homes. We're honored to elevate the backdrop of your lives. Your referrals mean the world to us.", subject: "general", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-6", brand: "lumepaint", platform: "nextdoor", content: "Looking for a painter who cares about quality as much as you do? Paint Pros Co elevates spaces with premium materials and artisan craftsmanship. We'd love to earn your trust.", subject: "general", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-7", brand: "lumepaint", platform: "nextdoor", content: "Neighbors! Perfect weather for exterior painting. Let Paint Pros Co elevate your curb appeal before summer. We use only premium paints for lasting results.", subject: "exterior-home", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-8", brand: "lumepaint", platform: "nextdoor", content: "Getting ready for holiday gatherings? Elevate your entertaining spaces with fresh paint. Paint Pros Co still has availability before Thanksgiving.", subject: "interior-walls", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-9", brand: "lumepaint", platform: "nextdoor", content: "Supporting local businesses matters! Paint Pros Co is proud to elevate the backdrop of our neighbors' lives. Thank you for keeping it local.", subject: "general", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-10", brand: "lumepaint", platform: "nextdoor", content: "Planning to sell? Elevated paint = elevated offers. Paint Pros Co helps homeowners maximize their investment with strategic painting. Free consultations for neighbors.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-11", brand: "lumepaint", platform: "nextdoor", content: "New neighbors? Welcome! Let Paint Pros Co help make your new house a home. We elevate spaces with colors that reflect your personal style.", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-12", brand: "lumepaint", platform: "nextdoor", content: "Outdoor living spaces deserve elevation too! Deck staining, pergola painting, and more. Paint Pros Co extends our boutique service to every surface.", subject: "deck-staining", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-13", brand: "lumepaint", platform: "nextdoor", content: "Winter is ideal for interior projects! Elevate your indoor spaces while it's cold outside. Paint Pros Co is booking now for cozy winter transformations.", subject: "interior-walls", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-14", brand: "lumepaint", platform: "nextdoor", content: "Boutique businesses deserve elevated spaces. Paint Pros Co serves local shops, salons, and offices with the same care we bring to homes.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-nd-15", brand: "lumepaint", platform: "nextdoor", content: "Complimentary color consultations for neighbors! Not sure what color to choose? Let our design-trained team help you envision the perfect elevated palette.", subject: "general", tone: "friendly", cta: "call-us", hashtags: [], createdAt: new Date().toISOString() },
        // Lume Twitter/X (10)
        { id: "lume-tw-1", brand: "lumepaint", platform: "x", content: "We elevate the backdrop of your life. That's the Paint Pros promise. #PaintProsCo #ElevatedLiving", subject: "general", tone: "professional", cta: "call-us", hashtags: ["#PaintProsCo", "#ElevatedLiving"], createdAt: new Date().toISOString() },
        { id: "lume-tw-2", brand: "lumepaint", platform: "x", content: "Before: ordinary. After: elevated. The Paint Pros transformation. #BeforeAfter #Elevated", subject: "before-after", tone: "friendly", cta: "get-quote", hashtags: ["#BeforeAfter", "#Elevated"], createdAt: new Date().toISOString() },
        { id: "lume-tw-3", brand: "lumepaint", platform: "x", content: "Curb appeal, elevated. First impressions that last. #ExteriorDesign #PaintProsCo", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#ExteriorDesign", "#CurbAppeal"], createdAt: new Date().toISOString() },
        { id: "lume-tw-4", brand: "lumepaint", platform: "x", content: "Kitchen cabinets = kitchen soul. Elevate yours. #KitchenDesign #CabinetGoals", subject: "cabinet-work", tone: "friendly", cta: "call-us", hashtags: ["#KitchenDesign", "#CabinetGoals"], createdAt: new Date().toISOString() },
        { id: "lume-tw-5", brand: "lumepaint", platform: "x", content: "In the details, we find excellence. Elevated trim work that defines spaces. #Craftsmanship", subject: "trim-detail", tone: "professional", cta: "get-quote", hashtags: ["#Craftsmanship", "#Details"], createdAt: new Date().toISOString() },
        { id: "lume-tw-6", brand: "lumepaint", platform: "x", content: "Spring = renewal. Time to elevate the backdrop of your life. #SpringDesign #FreshStart", subject: "general", tone: "friendly", cta: "get-quote", hashtags: ["#SpringDesign", "#FreshStart"], createdAt: new Date().toISOString() },
        { id: "lume-tw-7", brand: "lumepaint", platform: "x", content: "Commercial spaces, elevated. Where business meets beautiful. #CommercialDesign", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#CommercialDesign", "#ElevatedBusiness"], createdAt: new Date().toISOString() },
        { id: "lume-tw-8", brand: "lumepaint", platform: "x", content: "Color is personal. We help you find yours. Elevated expression awaits. #ColorConsulting", subject: "interior-walls", tone: "friendly", cta: "call-us", hashtags: ["#ColorConsulting", "#DesignVoice"], createdAt: new Date().toISOString() },
        { id: "lume-tw-9", brand: "lumepaint", platform: "x", content: "Another backdrop elevated. Another client delighted. That's what we live for. #ClientLove", subject: "general", tone: "friendly", cta: "call-us", hashtags: ["#ClientLove", "#ElevatedResults"], createdAt: new Date().toISOString() },
        { id: "lume-tw-10", brand: "lumepaint", platform: "x", content: "Bold color choices = elevated living. Don't hold back. #BoldDesign #StatementSpaces", subject: "interior-walls", tone: "friendly", cta: "get-quote", hashtags: ["#BoldDesign", "#StatementSpaces"], createdAt: new Date().toISOString() },
        // Lume LinkedIn (10)
        { id: "lume-li-1", brand: "lumepaint", platform: "linkedin", content: "At Paint Pros Co, we believe spaces shape experiences. Our mission is elevating the backdrop of your life through artisan craftsmanship, premium materials, and thoughtful design. Connect with us to discuss how we can elevate your next project.", subject: "general", tone: "professional", cta: "call-us", hashtags: ["#LuxuryPainting", "#ArtisanCraftsmanship", "#ElevatedDesign"], createdAt: new Date().toISOString() },
        { id: "lume-li-2", brand: "lumepaint", platform: "linkedin", content: "Boutique commercial spaces deserve elevated attention. Paint Pros Co brings residential-quality care to salons, spas, boutiques, and professional offices. Your space is your brand - let us elevate it.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#BoutiqueDesign", "#CommercialPainting", "#BrandExperience"], createdAt: new Date().toISOString() },
        { id: "lume-li-3", brand: "lumepaint", platform: "linkedin", content: "Luxury real estate demands elevated finishes. Paint Pros Co partners with discerning realtors and developers to deliver paint work that commands premium prices. Elevate your listings.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: ["#LuxuryRealEstate", "#PremiumFinishes", "#ElevatedListings"], createdAt: new Date().toISOString() },
        { id: "lume-li-4", brand: "lumepaint", platform: "linkedin", content: "We're growing our team of artisan painters. Paint Pros Co seeks craftspeople who share our passion for elevating spaces with precision and care. DM to learn about opportunities.", subject: "team-action", tone: "professional", cta: "call-us", hashtags: ["#NowHiring", "#ArtisanCareers", "#CraftsmanshipCareers"], createdAt: new Date().toISOString() },
        { id: "lume-li-5", brand: "lumepaint", platform: "linkedin", content: "Case study: Elevating a historic home's interior while preserving its character. Premium paints, careful preparation, and respect for architecture. That's the Lume approach.", subject: "interior-walls", tone: "professional", cta: "call-us", hashtags: ["#HistoricHomes", "#PreservationPainting", "#ElevatedRestoration"], createdAt: new Date().toISOString() },
        { id: "lume-li-6", brand: "lumepaint", platform: "linkedin", content: "Interior designers: Partner with a painting company that matches your standards. Paint Pros Co elevates your vision with flawless execution. Designer referral program available.", subject: "general", tone: "professional", cta: "get-quote", hashtags: ["#InteriorDesign", "#DesignerPartner", "#ElevatedExecution"], createdAt: new Date().toISOString() },
        { id: "lume-li-7", brand: "lumepaint", platform: "linkedin", content: "Excellence is not an accident. Paint Pros Co has built our reputation on elevating the backdrop of our clients' lives through meticulous attention to every detail. Experience matters.", subject: "general", tone: "professional", cta: "call-us", hashtags: ["#Excellence", "#AttentionToDetail", "#QualityMatters"], createdAt: new Date().toISOString() },
        { id: "lume-li-8", brand: "lumepaint", platform: "linkedin", content: "Hospitality spaces require elevated aesthetics. Hotels, restaurants, and event venues trust Paint Pros Co for paint work that enhances guest experiences. Minimal disruption, maximum impact.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: ["#HospitalityDesign", "#GuestExperience", "#ElevatedHospitality"], createdAt: new Date().toISOString() },
        { id: "lume-li-9", brand: "lumepaint", platform: "linkedin", content: "High-end home builders: Elevate your finish work with Paint Pros Co. We understand that luxury buyers expect perfection. Our artisan painters deliver exactly that.", subject: "interior-walls", tone: "professional", cta: "get-quote", hashtags: ["#LuxuryBuilder", "#PremiumFinishes", "#NewConstruction"], createdAt: new Date().toISOString() },
        { id: "lume-li-10", brand: "lumepaint", platform: "linkedin", content: "Grateful for every client who trusts us to elevate the backdrop of their lives. Your referrals are the highest compliment. Thank you for helping Paint Pros Co grow.", subject: "general", tone: "professional", cta: "call-us", hashtags: ["#ClientAppreciation", "#ReferralThanks", "#GrowingTogether"], createdAt: new Date().toISOString() },
        // Lume Google Business (5)
        { id: "lume-gb-1", brand: "lumepaint", platform: "google", content: "Paint Pros Co elevates the backdrop of your life with premium painting services. Boutique attention, artisan craftsmanship, exceptional results. Schedule your complimentary consultation today.", subject: "general", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-gb-2", brand: "lumepaint", platform: "google", content: "Spring booking now open! Elevate your home's exterior with Paint Pros Co. We use only premium paints and meticulous preparation for lasting, beautiful results.", subject: "exterior-home", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-gb-3", brand: "lumepaint", platform: "google", content: "Cabinet painting that elevates kitchens. Paint Pros Co transforms dated cabinets into stunning focal points with precision and care. Free consultations available.", subject: "cabinet-work", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-gb-4", brand: "lumepaint", platform: "google", content: "Boutique commercial painting for discerning businesses. Paint Pros Co elevates salons, spas, offices, and retail spaces with residential-level care. Contact us today.", subject: "commercial-space", tone: "professional", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
        { id: "lume-gb-5", brand: "lumepaint", platform: "google", content: "Thank you for the wonderful reviews! Paint Pros Co is honored to elevate the backdrop of our clients' lives. Experience the difference - schedule your consultation today.", subject: "general", tone: "friendly", cta: "get-quote", hashtags: [], createdAt: new Date().toISOString() },
      ];
      
      const allMessages = [...nppMessages, ...lumeMessages];
      setMessageTemplates(allMessages);
      localStorage.setItem("marketing_messages", JSON.stringify(allMessages));
    }
    
    const savedBundles = localStorage.getItem("marketing_bundles");
    if (savedBundles) {
      setContentBundles(JSON.parse(savedBundles));
    }
  }, []);

  const validatePinStrength = (testPin: string): boolean => {
    const hasLower = /[a-z]/.test(testPin);
    const hasUpper = /[A-Z]/.test(testPin);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(testPin);
    const hasNumber = /[0-9]/.test(testPin);
    return hasLower && hasUpper && hasSpecial && hasNumber && testPin.length >= 6;
  };

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/auth/pin/verify-any", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      
      if (data.success && (data.role === "marketing" || data.role === "developer" || data.role === "owner" || data.role === "admin" || data.role === "ops_manager")) {
        setIsAuthenticated(true);
        setUserRole(data.role);
        const roleNames: Record<string, string> = {
          marketing: "Logan",
          developer: "Jason", 
          owner: "Ryan",
          admin: "Sidonie",
          ops_manager: "Sidonie",
          project_manager: "PM",
          crew_lead: "Crew Lead",
        };
        const name = roleNames[data.role] || data.role;
        setUserName(name);
        setError("");
        setShowWelcomeModal(true);
        
        // Save session for 30 days if "Stay logged in" is checked
        if (stayLoggedIn) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30);
          localStorage.setItem("marketing_session", JSON.stringify({
            role: data.role,
            name: name,
            expiry: expiry.toISOString(),
          }));
        }
        
        if (data.mustChangePin) {
          setShowPinChange(true);
        }
      } else if (data.success) {
        setError("Access denied. Authorized personnel only.");
      } else {
        setError("Invalid PIN. Please try again.");
      }
    } catch (err) {
      setError("Failed to verify PIN. Please try again.");
    }
  };

  const handlePinChange = async (newPin: string) => {
    if (validatePinStrength(newPin)) {
      try {
        const response = await fetch("/api/auth/pin/change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: userRole, currentPin: pin, newPin }),
        });
        const data = await response.json();
        if (data.success) {
          setShowPinChange(false);
        }
      } catch (err) {
        console.error("Failed to change PIN:", err);
      }
    }
  };

  const savePosts = (updated: SocialPost[]) => {
    setPosts(updated);
    localStorage.setItem("marketing_posts", JSON.stringify(updated));
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (post.brand !== selectedTenant) return false;
      if (platformFilter !== "all" && post.platform !== platformFilter) return false;
      if (typeFilter !== "all" && post.type !== typeFilter) return false;
      if (categoryFilter !== "all" && post.category !== categoryFilter) return false;
      if (searchQuery && !post.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [posts, selectedTenant, platformFilter, typeFilter, categoryFilter, searchQuery]);

  const checkDuplicateUsage = (post: SocialPost): boolean => {
    if (!post.lastUsed) return false;
    const fourWeeksAgo = subWeeks(new Date(), 4);
    return isAfter(new Date(post.lastUsed), fourWeeksAgo);
  };

  const schedulePost = (post: SocialPost, date: string) => {
    if (checkDuplicateUsage(post)) {
      setDuplicatePost(post);
      setShowDuplicateWarning(true);
      return;
    }
    confirmSchedule(post, date);
  };

  const confirmSchedule = (post: SocialPost, date: string) => {
    const updated = posts.map(p => 
      p.id === post.id 
        ? { ...p, status: "scheduled" as const, scheduledDate: date, lastUsed: date }
        : p
    );
    savePosts(updated);
    setShowDuplicateWarning(false);
    setDuplicatePost(null);
  };

  const markAsPosted = (postId: string) => {
    const updated = posts.map(p => 
      p.id === postId ? { ...p, status: "posted" as const, lastUsed: new Date().toISOString() } : p
    );
    savePosts(updated);
  };

  const claimPost = (postId: string, userName: string) => {
    const updated = posts.map(p => 
      p.id === postId ? { ...p, claimedBy: userName } : p
    );
    savePosts(updated);
  };

  const deletePost = (postId: string) => {
    const updated = posts.filter(p => p.id !== postId);
    savePosts(updated);
  };

  const updatePost = (postId: string, updates: Partial<SocialPost>) => {
    const updated = posts.map(p => 
      p.id === postId ? { ...p, ...updates } : p
    );
    savePosts(updated);
    setEditingPost(null);
  };

  const addPost = (newPost: Partial<SocialPost>) => {
    const post: SocialPost = {
      id: `${selectedTenant}-${Date.now()}`,
      brand: selectedTenant,
      platform: newPost.platform || "instagram",
      type: newPost.type || "evergreen",
      category: newPost.category || "general",
      content: newPost.content || "",
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    savePosts([...posts, post]);
    setShowAddModal(false);
  };

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(calendarWeekStart, i);
      const dayPosts = posts.filter(p => 
        p.brand === selectedTenant && 
        p.scheduledDate && 
        format(new Date(p.scheduledDate), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );
      days.push({ date, posts: dayPosts });
    }
    return days;
  }, [calendarWeekStart, posts, selectedTenant]);

  // Website Analytics Query - Real traffic data
  const { data: websiteAnalytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<{
    today: { views: number; visitors: number };
    thisWeek: { views: number; visitors: number };
    thisMonth: { views: number; visitors: number };
    allTime: { views: number; visitors: number };
    liveVisitors: number;
    topPages: { page: string; views: number }[];
    topReferrers: { referrer: string; count: number }[];
    deviceBreakdown: { desktop: number; mobile: number; tablet: number };
    hourlyTraffic: { hour: number; views: number }[];
    dailyTraffic: { date: string; views: number; visitors: number }[];
  }>({
    queryKey: ["/api/analytics/dashboard", selectedTenant],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/dashboard?tenantId=${selectedTenant}`);
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Lead Source Attribution Query - Real data from leads and bookings
  const { data: leadSources } = useQuery<Record<string, number>>({
    queryKey: ["/api/leads/sources", selectedTenant],
    queryFn: async () => {
      const res = await fetch(`/api/leads/sources?tenantId=${selectedTenant}`);
      if (!res.ok) return {};
      return res.json();
    },
    refetchInterval: 60000,
  });

  // Use real database stats when available, fallback to localStorage stats
  const stats = useMemo(() => {
    // If we have real data from the database, use it
    if (marketingStats?.posts) {
      return {
        total: marketingStats.posts.total,
        evergreen: 0, // Not tracked in DB yet
        seasonal: 0, // Not tracked in DB yet
        scheduled: marketingStats.posts.scheduled,
        posted: marketingStats.posts.published,
        drafts: marketingStats.posts.drafts,
        // Add real engagement data
        impressions: marketingStats.engagement?.impressions || 0,
        reach: marketingStats.engagement?.reach || 0,
        clicks: marketingStats.engagement?.clicks || 0,
        activeCampaigns: marketingStats.ads?.activeCampaigns || 0,
        adSpend: marketingStats.ads?.totalSpend || 0,
        facebook: marketingStats.platforms?.facebook || 0,
        instagram: marketingStats.platforms?.instagram || 0,
      };
    }
    // Fallback to localStorage data
    const brandPosts = posts.filter(p => p.brand === selectedTenant);
    return {
      total: brandPosts.length,
      evergreen: brandPosts.filter(p => p.type === "evergreen").length,
      seasonal: brandPosts.filter(p => p.type === "seasonal").length,
      scheduled: brandPosts.filter(p => p.status === "scheduled").length,
      posted: brandPosts.filter(p => p.status === "posted").length,
      drafts: brandPosts.filter(p => p.status === "draft").length,
      impressions: 0,
      reach: 0,
      clicks: 0,
      activeCampaigns: 0,
      adSpend: 0,
      facebook: 0,
      instagram: 0,
    };
  }, [posts, selectedTenant, marketingStats]);

  if (!isAuthenticated) {
    return (
      <PageLayout hideNavbar hideFooter>
        <main className="min-h-screen flex">
          {/* Left Side - Hero Image - Shows on medium screens and up */}
          <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${crewTeamPhoto})`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f]/95 via-[#2d4a6f]/90 to-[#1e3a5f]/95" />
            
            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col justify-between p-12 text-white">
              <div>
                <span className="text-lg font-display font-bold opacity-80">Marketing Hub</span>
              </div>
              
              <div className="space-y-8">
                {/* Dual Brand Logos */}
                <div className="space-y-6">
                  {/* Lume Emblem - matches home-lume.tsx branding */}
                  <div>
                    <h2 
                      className="text-3xl font-light tracking-wide"
                      style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
                    >
                      Lume<sup className="text-sm align-super ml-0.5">™</sup>
                    </h2>
                    <p className="text-white/80 font-light tracking-[0.2em] uppercase text-sm -mt-1">Paint.co</p>
                    <p className="text-white/70 italic text-sm mt-2">Elevating the backdrop of your life</p>
                  </div>
                  
                </div>
                
                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/30" />
                  <span className="text-white/50 text-sm">&</span>
                  <div className="h-px flex-1 bg-white/30" />
                </div>
                
                {/* NPP Section - aligned with Lume */}
                <div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 inline-block mb-2">
                    <img 
                      src={nppLogo} 
                      alt="Nashville Painting Professionals" 
                      className="h-24 w-auto object-contain"
                    />
                  </div>
                  <p className="text-white/70 italic text-sm">Transforming familiar spaces into extraordinary places</p>
                </div>
                
                <p className="text-lg text-white/80 max-w-md">
                  Unified marketing management for both brands. Enter your PIN to access content, scheduling, and analytics.
                </p>
                
                {/* Feature Badges */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Content Calendar</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Analytics</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">Image Library</span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-white/50">
                Powered by PaintPros.io
              </div>
            </div>
          </div>
          
          {/* Right Side - Login Form */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md"
            >
              {/* Mobile Header - Hero image with dual branding */}
              <div className="md:hidden mb-6">
                <div className="relative rounded-2xl overflow-hidden mb-4">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${crewTeamPhoto})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1e3a5f]/85 to-[#1e3a5f]/95" />
                  <div className="relative z-10 p-5 text-white">
                    <p className="text-xs opacity-70 text-center mb-3">Marketing Hub</p>
                    
                    {/* Dual Logos */}
                    <div className="flex items-center justify-center gap-4">
                      {/* Lume - matches home-lume.tsx branding */}
                      <div className="text-center">
                        <p 
                          className="font-light tracking-wide text-xl"
                          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
                        >
                          Lume<sup className="text-[8px] align-super ml-0.5">™</sup>
                        </p>
                        <p className="text-white/80 font-light tracking-[0.15em] uppercase text-[10px] -mt-0.5">Paint.co</p>
                        <p className="text-white/60 text-xs italic mt-1">Elevating the backdrop of your life</p>
                      </div>
                      
                      {/* Divider */}
                      <div className="w-px h-12 bg-white/30" />
                      
                      {/* NPP - with tagline */}
                      <div className="text-center">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 inline-block">
                          <img 
                            src={nppLogo} 
                            alt="NPP" 
                            className="h-14 w-auto object-contain"
                          />
                        </div>
                        <p className="text-white/60 text-[9px] italic mt-1 max-w-[100px]">Transforming familiar spaces into extraordinary places</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <GlassCard className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Enter your PIN to access the dashboard
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="text-center text-xl tracking-widest h-14"
                    data-testid="input-marketing-pin"
                  />
                  {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                  )}
                  <Button 
                    onClick={handleLogin} 
                    className="w-full h-12 bg-[#1e3a5f] hover:bg-[#2d4a6f] text-lg"
                    data-testid="button-marketing-login"
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    Access Dashboard
                  </Button>
                  
                  {/* Stay Logged In Option */}
                  <div className="pt-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={stayLoggedIn}
                        onChange={(e) => setStayLoggedIn(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        data-testid="checkbox-stay-logged-in"
                      />
                      <div className="flex-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                          Stay logged in for 30 days
                        </span>
                        {stayLoggedIn && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Only use on your personal device
                          </p>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 text-center">
                    First time? Use default PIN, then set your own secure PIN.
                  </p>
                </div>
              </GlassCard>
              
              {/* Trust Indicators */}
              <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  <span>Secure</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Encrypted</span>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout hideNavbar hideFooter>
      <main className="min-h-screen py-4 md:py-8 px-2 md:px-4 pb-20 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 w-full overflow-hidden">
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-xl md:text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <span className="truncate">Marketing Hub</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {(selectedTenant === "npp" || selectedTenant === "lumepaint") 
                  ? "Paint Pros Co & Nashville Painting Professionals" 
                  : selectedTenant === "demo" 
                    ? "TrustLayer Marketing" 
                    : "Marketing Dashboard"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {userName && (
                <Badge variant="outline" className="bg-[#1e3a5f]/10 dark:bg-[#1e3a5f]/30 text-[#1e3a5f] dark:text-white border-[#1e3a5f]/30 text-xs">
                  {userName}
                </Badge>
              )}
              <TenantSwitcher 
                selectedTenant={selectedTenant} 
                onTenantChange={setSelectedTenant} 
              />
              {userRole === "developer" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/developer"}
                  data-testid="button-back-to-developer"
                  className="text-xs"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Developer Hub</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              )}
              {userRole === "owner" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/owner"}
                  data-testid="button-back-to-owner"
                  className="text-xs"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Owner Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              )}
              {userRole === "admin" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/admin"}
                  data-testid="button-back-to-admin"
                  className="text-xs"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowPinChange(true)}
                data-testid="button-change-pin"
                className="h-8 w-8"
              >
                <Lock className="w-3 h-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-red-600 h-8 w-8"
                data-testid="button-logout"
              >
                <LogOut className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>

          {/* Dual Branding Section - Lume & NPP */}
          {(selectedTenant === "lumepaint" || selectedTenant === "npp") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-6 py-4 px-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              {/* Lume Emblem */}
              <div className="flex flex-col items-center text-center">
                <h3 className="font-display text-lg md:text-xl font-bold text-[#1e3a5f] dark:text-white">
                  Paint Pros Co<span className="text-xs align-super">™</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Elevating the backdrop of your life
                </p>
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-gray-300 dark:bg-gray-600" />

              {/* NPP Emblem */}
              <div className="flex flex-col items-center">
                <img 
                  src={nppLogo} 
                  alt="Nashville Painting Professionals" 
                  className="h-12 md:h-16 w-auto object-contain"
                />
              </div>
            </motion.div>
          )}

          {/* Live Stats Banner - Real Database Data */}
          <GlassCard className="p-4 mb-4 border-l-4 border-green-500 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-600">Live Data from Database</span>
              {statsLoading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.posted}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Facebook className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                <p className="text-xl font-bold text-blue-600">{stats.facebook || 0}</p>
                <p className="text-xs text-muted-foreground">Facebook</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
                <Instagram className="w-4 h-4 mx-auto mb-1 text-pink-600" />
                <p className="text-xl font-bold text-pink-600">{stats.instagram || 0}</p>
                <p className="text-xs text-muted-foreground">Instagram</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <Target className="w-4 h-4 mx-auto mb-1 text-green-600" />
                <p className="text-xl font-bold text-green-600">{stats.activeCampaigns || 0}</p>
                <p className="text-xs text-muted-foreground">Active Ads</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <DollarSign className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <p className="text-xl font-bold text-amber-600">${(stats.adSpend || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Ad Spend</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Eye className="w-4 h-4 mx-auto mb-1 text-cyan-600" />
                <p className="text-xl font-bold text-cyan-600">{(stats.impressions || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
            </div>
          </GlassCard>

          {/* Recent Activity - Real Posts */}
          {marketingStats?.recentPosts && marketingStats.recentPosts.length > 0 && (
            <GlassCard className="p-4 mb-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Recent Published Posts
              </h3>
              <div className="space-y-2">
                {marketingStats.recentPosts.slice(0, 3).map((post) => (
                  <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    {post.platform === 'facebook' ? (
                      <Facebook className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
                    )}
                    <p className="text-sm flex-1 truncate">{post.message || 'Published post'}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Hero Section with Photo */}
          <div className="relative rounded-xl overflow-hidden mb-6">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${crewTeamPhoto})`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/95 via-[#1e3a5f]/80 to-transparent" />
            <div className="relative z-10 p-8 md:p-12">
              <div className="max-w-xl">
                {/* Brand Identity - matches home-lume.tsx styling */}
                <div className="mb-4">
                  <h1 
                    className="font-light tracking-wide text-white"
                    style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                  >
                    Lume<sup className="align-super ml-0.5" style={{ fontSize: 'clamp(0.5rem, 1vw, 1rem)' }}>™</sup>
                  </h1>
                  <p 
                    className="font-light tracking-[0.2em] uppercase text-white/90"
                    style={{ fontSize: 'clamp(0.6rem, 1vw, 1rem)' }}
                  >
                    Paint.co
                  </p>
                </div>
                <h2 className="text-xl md:text-2xl font-display font-bold text-white mb-3">
                  Marketing Command Center
                </h2>
                <p className="text-white/80 mb-6">
                  Create, schedule, and track all your marketing content in one place. 
                  Build your brand with professional imagery and data-driven insights.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    className="bg-white text-[#1e3a5f]"
                    onClick={() => setActiveTab("content")}
                    data-testid="hero-action-create"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Content
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white/30 text-white bg-white/10 backdrop-blur-sm"
                    onClick={() => setActiveTab("analytics")}
                    data-testid="hero-action-analytics"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-Friendly Tab Navigation */}
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b mb-4 -mx-4 px-4 py-2 md:hidden">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {[
                { id: 'content', label: 'Content', icon: Layers },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'calendar', label: 'Calendar', icon: Calendar },
                { id: 'playbook', label: 'Playbook', icon: BookOpen },
                { id: 'budget', label: 'Budget', icon: DollarSign },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className="shrink-0 gap-1.5"
                  data-testid={`mobile-tab-${tab.id}`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-xs">{tab.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Category Navigation Carousel - Desktop */}
          <div className="mb-6 hidden md:block">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {[
                { id: 'content', label: 'Content Studio', icon: Layers, image: interiorLivingRoom },
                { id: 'analytics', label: 'Analytics', icon: BarChart3, image: crewMeasuring },
                { id: 'calendar', label: 'Calendar', icon: Calendar, image: colorConsult },
                { id: 'playbook', label: 'Playbook', icon: BookOpen, image: crewTeamPhoto },
                { id: 'budget', label: 'Budget', icon: DollarSign, image: commercialLobby },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`relative flex-shrink-0 w-28 md:w-36 h-20 md:h-24 rounded-xl overflow-hidden snap-start transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'ring-2 ring-[#1e3a5f] ring-offset-2 ring-offset-background scale-[1.02]' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <img 
                    src={tab.image} 
                    alt={tab.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center gap-1.5">
                    <tab.icon className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="text-white text-xs font-medium truncate">{tab.label}</span>
                  </div>
                  {activeTab === tab.id && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>

            {/* CONTENT STUDIO TAB - Images, Messages, Social Posts */}
            <TabsContent value="content" className="space-y-6" data-testid="content-tab">
              
              {/* ═══════════════════════════════════════════════════════════════════
                  COMMAND CENTER - Visual Marketing Dashboard
                  Touch any thumbnail to configure, view stats, or manage
              ═══════════════════════════════════════════════════════════════════ */}
              
              {/* Command Center Header */}
              <div className="relative rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] via-[#2d5a8a] to-[#1e3a5f]" />
                <div className="relative z-10 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <LayoutGrid className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-display font-bold text-white">Command Center</h2>
                      </div>
                      <p className="text-white/70 text-sm">Touch any thumbnail to view stats, edit, or remove from rotation</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                        <p className="text-white/60 text-xs">Automation Status</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-white font-medium text-sm">Running</span>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setShowQuickPostModal(true)} data-testid="button-quick-post-header">
                        <Plus className="w-4 h-4 mr-1" />
                        Quick Post
                      </Button>
                    </div>
                  </div>
                  
                  {/* Quick Stats Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-green-400" />
                        <span className="text-white/70 text-xs">Live Posts</span>
                      </div>
                      <p className="text-white text-xl font-bold mt-1">{livePosts?.filter(p => p.status === 'published').length || 0}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-white/70 text-xs">In Queue</span>
                      </div>
                      <p className="text-white text-xl font-bold mt-1">{scheduledQueue?.filter(p => p.status === 'scheduled').length || 0}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-orange-400" />
                        <span className="text-white/70 text-xs">Active Ads</span>
                      </div>
                      <p className="text-white text-xl font-bold mt-1">{adCampaigns?.filter(c => c.status === 'active').length || 0}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-400" />
                        <span className="text-white/70 text-xs">Library Size</span>
                      </div>
                      <p className="text-white text-xl font-bold mt-1">{allImages.filter(i => i.brand === selectedTenant).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════ ZONE 1: LIVE NOW - What's Currently Posted ═══════════ */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Live Now</h3>
                    <Badge variant="default" className="bg-green-500">{livePosts?.filter(p => p.status === 'published').length || 0} Active</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Touch to view analytics or remove</p>
                </div>
                
                {livePosts && livePosts.filter(p => p.status === 'published').length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {livePosts.filter(p => p.status === 'published').slice(0, 12).map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="relative aspect-square rounded-lg overflow-hidden group border-2 border-transparent hover:border-green-500 transition-all shadow-sm hover:shadow-lg"
                        data-testid={`live-post-${post.id}`}
                      >
                        {post.imageUrl ? (
                          <img src={post.imageUrl} alt="Post" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-white/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Platform Badge */}
                        <div className="absolute top-1 left-1">
                          {post.platform === 'facebook' ? (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Facebook className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 flex items-center justify-center">
                              <Instagram className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Live indicator */}
                        <div className="absolute top-1 right-1">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No posts live yet</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowQuickPostModal(true)}>
                      Create First Post
                    </Button>
                  </div>
                )}
              </GlassCard>

              {/* ═══════════ ZONE 2: IN QUEUE - Scheduled & Ready ═══════════ */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">In Queue</h3>
                    <Badge variant="secondary">{scheduledQueue?.filter(p => p.status === 'scheduled').length || 0} Waiting</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Touch to edit or reorder</p>
                </div>
                
                {scheduledQueue && scheduledQueue.filter(p => p.status === 'scheduled').length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {scheduledQueue.filter(p => p.status === 'scheduled').slice(0, 12).map((post, idx) => (
                      <button
                        key={post.id}
                        className="relative aspect-square rounded-lg overflow-hidden group border-2 border-transparent hover:border-blue-500 transition-all shadow-sm"
                        data-testid={`queued-post-${post.id}`}
                        onClick={() => {
                          setSelectedQueuePost(post);
                          setQueuePostIndex(idx);
                        }}
                      >
                        {post.imageUrl ? (
                          <img src={post.imageUrl} alt="Queued" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-white/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        
                        {/* Queue position */}
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </div>
                        
                        {/* Platform */}
                        <div className="absolute top-1 right-1">
                          {post.platform === 'facebook' ? (
                            <Facebook className="w-3.5 h-3.5 text-white drop-shadow" />
                          ) : (
                            <Instagram className="w-3.5 h-3.5 text-white drop-shadow" />
                          )}
                        </div>
                        
                        {/* Scheduled time */}
                        <div className="absolute bottom-0 left-0 right-0 p-1 text-center">
                          <p className="text-white text-[10px] font-medium drop-shadow">
                            {format(new Date(post.scheduledAt), 'MMM d, h:mma')}
                          </p>
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Queue is empty - automation will pull from your library</p>
                  </div>
                )}
              </GlassCard>

              {/* ═══════════ ZONE 3: PAID ADS - Active Campaigns ═══════════ */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Paid Ads Running</h3>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                      {adCampaigns?.filter(c => c.status === 'active').length || 0} Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Touch to view performance or pause</p>
                </div>
                
                {adCampaigns && adCampaigns.filter(c => c.status === 'active').length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {adCampaigns.filter(c => c.status === 'active').slice(0, 8).map((campaign) => (
                      <button
                        key={campaign.id}
                        className="relative rounded-lg overflow-hidden group border-2 border-transparent hover:border-orange-500 transition-all shadow-sm bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 p-3"
                        data-testid={`ad-campaign-${campaign.id}`}
                      >
                        {campaign.adImageUrl ? (
                          <div className="aspect-video rounded overflow-hidden mb-2">
                            <img src={campaign.adImageUrl} alt={campaign.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="aspect-video rounded bg-orange-200 dark:bg-orange-800 flex items-center justify-center mb-2">
                            <Target className="w-8 h-8 text-orange-500" />
                          </div>
                        )}
                        
                        <div className="text-left">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{campaign.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">${campaign.dailyBudget}/day</span>
                            <div className="flex items-center gap-1">
                              {campaign.platform === 'facebook' || campaign.platform === 'both' ? (
                                <Facebook className="w-3 h-3 text-blue-500" />
                              ) : null}
                              {campaign.platform === 'instagram' || campaign.platform === 'both' ? (
                                <Instagram className="w-3 h-3 text-pink-500" />
                              ) : null}
                            </div>
                          </div>
                          {campaign.endDate && (
                            <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1">
                              Ends {format(new Date(campaign.endDate), 'MMM d')}
                            </p>
                          )}
                        </div>
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <div className="bg-white dark:bg-gray-900 rounded-full p-2 shadow-lg">
                            <BarChart3 className="w-4 h-4 text-orange-500" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No paid ads running</p>
                    <p className="text-xs mt-1">Ads run automatically during business hours (8am-6pm)</p>
                  </div>
                )}
              </GlassCard>

              {/* ═══════════ ZONE 4: YOUR LIBRARY - Quick Add to Queue ═══════════ */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Your Library</h3>
                    <Badge variant="secondary">{allImages.filter(i => i.brand === selectedTenant).length} Images</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setShowAddImageModal(true)} data-testid="button-add-to-library">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Image
                  </Button>
                </div>
                
                {allImages.filter(i => i.brand === selectedTenant).length > 0 ? (
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {allImages.filter(i => i.brand === selectedTenant).slice(0, 16).map((image) => (
                      <button
                        key={image.id}
                        className="relative aspect-square rounded-lg overflow-hidden group border-2 border-transparent hover:border-purple-500 transition-all"
                        data-testid={`library-image-${image.id}`}
                      >
                        <img src={image.url} alt={image.subject} className="absolute inset-0 w-full h-full object-cover" />
                        
                        {/* Category badge */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-0.5">
                          <p className="text-white text-[8px] text-center truncate">{image.subject}</p>
                        </div>
                        
                        {/* Hover - Add to queue */}
                        <div className="absolute inset-0 bg-purple-500/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No images in library yet</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowAddImageModal(true)}>
                      Upload First Image
                    </Button>
                  </div>
                )}
              </GlassCard>

              {/* AI Suggested Post Today */}
              <TodaysSuggestedPost 
                contentBundles={contentBundles.filter(b => b.brand === selectedTenant)}
                allImages={allImages.filter(i => i.brand === selectedTenant)}
                messageTemplates={messageTemplates.filter(m => m.brand === selectedTenant)}
              />

              {/* Sub-Tabs for Content Types */}
              <Tabs defaultValue="images" className="w-full">
                <TabsList className="grid grid-cols-3 gap-1 h-auto p-1 mb-4">
                  <TabsTrigger value="images" className="flex items-center gap-2 py-2.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>Images</span>
                    <Badge variant="secondary" className="text-xs">{allImages.filter(i => i.brand === selectedTenant).length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="flex items-center gap-2 py-2.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>Messages</span>
                    <Badge variant="secondary" className="text-xs">{messageTemplates.filter(m => m.brand === selectedTenant).length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="bundles" className="flex items-center gap-2 py-2.5">
                    <Wand2 className="w-4 h-4" />
                    <span>Bundles</span>
                    <Badge variant="secondary" className="text-xs">{contentBundles.filter(b => b.brand === selectedTenant).length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-2 py-2.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Performance</span>
                  </TabsTrigger>
                </TabsList>

                {/* Images Sub-Tab */}
                <TabsContent value="images" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Image Library</h3>
                      <p className="text-sm text-muted-foreground">Professional photos for your marketing</p>
                    </div>
                    <Button onClick={() => setShowAddImageModal(true)} data-testid="button-add-image">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Image
                    </Button>
                  </div>
                  
                  {/* Image Tips */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Pro Tip:</strong> High-quality before/after photos and finished project shots get 3x more engagement than stock images.
                    </p>
                  </div>

                  {/* Subject Filter Carousel */}
                  <div className="overflow-x-auto pb-2 -mx-2 px-2">
                    <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                      <button
                        onClick={() => setImageSubjectFilter("all")}
                        className={`relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden group transition-all ${
                          imageSubjectFilter === "all" ? "ring-2 ring-[#1e3a5f] ring-offset-2" : ""
                        }`}
                        data-testid="filter-all-subjects"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
                          <LayoutGrid className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-end p-1.5">
                          <span className="text-white text-xs font-medium drop-shadow-lg">All</span>
                        </div>
                      </button>
                      {IMAGE_SUBJECTS.map(subject => (
                        <button
                          key={subject.id}
                          onClick={() => setImageSubjectFilter(subject.id)}
                          className={`relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden group transition-all ${
                            imageSubjectFilter === subject.id ? "ring-2 ring-[#1e3a5f] ring-offset-2" : ""
                          }`}
                          data-testid={`filter-${subject.id}`}
                        >
                          <img 
                            src={subject.image} 
                            alt={subject.label} 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/60 transition-colors flex items-end p-1.5">
                            <span className="text-white text-xs font-medium drop-shadow-lg leading-tight">{subject.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Grid */}
                  {allImages.filter(i => i.brand === selectedTenant).length === 0 ? (
                    <GlassCard className="p-8 text-center">
                      <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Images Yet</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Start building your library with professional photos from your best projects.
                      </p>
                      <Button onClick={() => setShowAddImageModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Image
                      </Button>
                    </GlassCard>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {allImages
                        .filter(img => img.brand === selectedTenant)
                        .filter(img => imageSubjectFilter === "all" || img.subject === imageSubjectFilter)
                        .map(img => (
                          <GlassCard key={img.id} className="overflow-hidden group">
                            <div className="aspect-square relative">
                              <img src={img.url} alt={img.description} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button size="sm" variant="secondary">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                            <div className="p-3">
                              <Badge variant="secondary" className="text-xs">{IMAGE_SUBJECTS.find(s => s.id === img.subject)?.label || img.subject}</Badge>
                              {img.id.startsWith('db-') && (
                                <Badge className="ml-1 text-xs bg-green-500/20 text-green-600">Field</Badge>
                              )}
                            </div>
                          </GlassCard>
                        ))}
                    </div>
                  )}
                </TabsContent>

                {/* Messages Sub-Tab */}
                <TabsContent value="messages" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Message Templates</h3>
                      <p className="text-sm text-muted-foreground">Ready-to-use captions and copy</p>
                    </div>
                    <Button onClick={() => setShowAddMessageModal(true)} data-testid="button-add-message">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Message
                    </Button>
                  </div>

                  {/* Message Tips */}
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      <strong>Pro Tip:</strong> Messages with a clear call-to-action ("Get your free estimate") convert 2x better than posts without one.
                    </p>
                  </div>

                  {messageTemplates.filter(m => m.brand === selectedTenant).length === 0 ? (
                    <GlassCard className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Messages Yet</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Create message templates to pair with your images for quick posting.
                      </p>
                      <Button onClick={() => setShowAddMessageModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Message
                      </Button>
                    </GlassCard>
                  ) : (
                    <div className="space-y-3">
                      {messageTemplates
                        .filter(msg => msg.brand === selectedTenant)
                        .map(msg => (
                          <GlassCard key={msg.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 dark:text-white mb-2">{msg.content}</p>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="secondary">{IMAGE_SUBJECTS.find(s => s.id === msg.subject)?.label}</Badge>
                                  <Badge variant="outline">{MESSAGE_TONES.find(t => t.id === msg.tone)?.label}</Badge>
                                  {msg.cta !== "none" && <Badge className="bg-green-100 text-green-800">{MESSAGE_CTAS.find(c => c.id === msg.cta)?.label}</Badge>}
                                </div>
                              </div>
                              <Button size="icon" variant="ghost">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </GlassCard>
                        ))}
                    </div>
                  )}
                </TabsContent>

                {/* Bundles Sub-Tab */}
                <TabsContent value="bundles" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Content Bundles</h3>
                      <p className="text-sm text-muted-foreground">Image + message combinations ready to post</p>
                    </div>
                    <Button 
                      onClick={async () => {
                        setIsGeneratingMatch(true);
                        const tenantImages = allImages.filter(img => img.brand === selectedTenant);
                        const tenantMessages = messageTemplates.filter(msg => msg.brand === selectedTenant);
                        const newBundles: ContentBundle[] = [];
                        for (const image of tenantImages) {
                          const matchingMessages = tenantMessages.filter(msg => msg.subject === image.subject);
                          for (const msg of matchingMessages) {
                            const exists = contentBundles.some(b => b.imageId === image.id && b.messageId === msg.id);
                            if (!exists) {
                              newBundles.push({
                                id: `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                imageId: image.id,
                                messageId: msg.id,
                                brand: selectedTenant,
                                platform: msg.platform,
                                status: "suggested",
                                postType: "organic",
                                createdAt: new Date().toISOString(),
                              });
                            }
                          }
                        }
                        const updated = [...contentBundles, ...newBundles];
                        setContentBundles(updated);
                        localStorage.setItem("marketing_bundles", JSON.stringify(updated));
                        setIsGeneratingMatch(false);
                      }}
                      disabled={isGeneratingMatch || allImages.length === 0 || messageTemplates.length === 0}
                      data-testid="button-generate-bundles"
                    >
                      {isGeneratingMatch ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Generate Bundles
                    </Button>
                  </div>

                  {/* Bundle Tips */}
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-800 dark:text-purple-200">
                      <strong>How it works:</strong> We match images and messages with the same topic tags to create ready-to-post combinations.
                    </p>
                  </div>

                  {/* Content Type Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-muted-foreground">Filter:</span>
                    <Button 
                      size="sm" 
                      variant={contentTypeFilter === "all" ? "default" : "outline"}
                      onClick={() => setContentTypeFilter("all")}
                      data-testid="filter-all"
                    >
                      All
                    </Button>
                    <Button 
                      size="sm" 
                      variant={contentTypeFilter === "organic" ? "default" : "outline"}
                      onClick={() => setContentTypeFilter("organic")}
                      data-testid="filter-organic"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Organic Posts
                    </Button>
                    <Button 
                      size="sm" 
                      variant={contentTypeFilter === "paid_ad" ? "default" : "outline"}
                      onClick={() => setContentTypeFilter("paid_ad")}
                      data-testid="filter-paid-ads"
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      Paid Ads
                    </Button>
                  </div>

                  {/* Meta Integration Banner */}
                  <GlassCard className="p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Share2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Meta Business Suite</h4>
                          <p className="text-xs text-muted-foreground">
                            {metaConnected 
                              ? "Connected - Auto-posting enabled" 
                              : "Connect to enable auto-posting to Facebook & Instagram"}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant={metaConnected ? "outline" : "default"}
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Coming Soon",
                            description: "Meta Business Suite integration will be available once developer access is configured."
                          });
                        }}
                        data-testid="button-connect-meta"
                      >
                        {metaConnected ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            Connected
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect Meta
                          </>
                        )}
                      </Button>
                    </div>
                  </GlassCard>

                  {contentBundles.filter(b => b.brand === selectedTenant).length === 0 ? (
                    <GlassCard className="p-8 text-center">
                      <Wand2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Bundles Yet</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Add images and messages first, then generate smart bundles.
                      </p>
                    </GlassCard>
                  ) : contentBundles.filter(b => b.brand === selectedTenant && (contentTypeFilter === "all" || b.postType === contentTypeFilter)).length === 0 ? (
                    <GlassCard className="p-6 text-center">
                      <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">No {contentTypeFilter === "paid_ad" ? "Paid Ads" : "Organic Posts"} Found</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Try a different filter or convert some bundles to {contentTypeFilter === "paid_ad" ? "ads" : "posts"}.
                      </p>
                    </GlassCard>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {contentBundles
                        .filter(b => b.brand === selectedTenant && (contentTypeFilter === "all" || b.postType === contentTypeFilter))
                        .slice(0, 6)
                        .map(bundle => {
                          const image = allImages.find(i => i.id === bundle.imageId);
                          const message = messageTemplates.find(m => m.id === bundle.messageId);
                          return (
                            <GlassCard key={bundle.id} className="p-4">
                              <div className="flex gap-4">
                                {image && (
                                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={image.url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                                    {message?.content || "No message"}
                                  </p>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${bundle.postType === "paid_ad" ? "border-orange-400 text-orange-600 dark:text-orange-400" : "border-green-400 text-green-600 dark:text-green-400"}`}
                                    >
                                      {bundle.postType === "paid_ad" ? (
                                        <><DollarSign className="w-3 h-3 mr-1" />Ad</>
                                      ) : (
                                        <><FileText className="w-3 h-3 mr-1" />Post</>
                                      )}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const newType: ContentBundle['postType'] = bundle.postType === "paid_ad" ? "organic" : "paid_ad";
                                        const updated = contentBundles.map(b => 
                                          b.id === bundle.id ? {...b, postType: newType} : b
                                        );
                                        setContentBundles(updated);
                                        localStorage.setItem("marketing_bundles", JSON.stringify(updated));
                                        toast({
                                          title: newType === "paid_ad" ? "Converted to Ad" : "Converted to Post",
                                          description: `This bundle is now marked as a ${newType === "paid_ad" ? "paid advertisement" : "organic post"}.`
                                        });
                                      }}
                                      data-testid={`toggle-content-type-${bundle.id}`}
                                    >
                                      {bundle.postType === "paid_ad" ? "Make Post" : "Make Ad"}
                                    </Button>
                                    <Badge variant="outline" className="text-xs">{bundle.platform}</Badge>
                                    <select
                                      className="text-xs px-2 py-1 rounded border bg-background"
                                      value={bundle.status}
                                      onChange={(e) => {
                                        const updated = contentBundles.map(b => 
                                          b.id === bundle.id ? {...b, status: e.target.value as ContentBundle['status']} : b
                                        );
                                        setContentBundles(updated);
                                        localStorage.setItem("marketing_bundles", JSON.stringify(updated));
                                      }}
                                      data-testid={`select-status-${bundle.id}`}
                                    >
                                      <option value="suggested">Suggested</option>
                                      <option value="circulating">Circulating</option>
                                      <option value="posted">Posted</option>
                                      <option value="removed">Removed</option>
                                    </select>
                                  </div>
                                  <div className="flex gap-1 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        if (image) {
                                          const response = await fetch(image.url);
                                          const blob = await response.blob();
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `${bundle.platform}-${image.description.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          URL.revokeObjectURL(url);
                                        }
                                      }}
                                      data-testid={`button-download-image-${bundle.id}`}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Image
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (message) {
                                          navigator.clipboard.writeText(message.content);
                                          toast({ title: "Copied!", description: "Message copied to clipboard" });
                                        }
                                      }}
                                      data-testid={`button-copy-message-${bundle.id}`}
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        if (image && message) {
                                          const response = await fetch(image.url);
                                          const blob = await response.blob();
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `${bundle.platform}-${image.description.replace(/\s+/g, '-').toLowerCase()}.jpg`;
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          URL.revokeObjectURL(url);
                                          navigator.clipboard.writeText(message.content);
                                          toast({ title: "Bundle Downloaded!", description: "Image saved and message copied to clipboard - ready to post!" });
                                          const updated = contentBundles.map(b => 
                                            b.id === bundle.id ? {...b, status: 'circulating' as ContentBundle['status']} : b
                                          );
                                          setContentBundles(updated);
                                          localStorage.setItem("marketing_bundles", JSON.stringify(updated));
                                        }
                                      }}
                                      data-testid={`button-download-bundle-${bundle.id}`}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Both
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </GlassCard>
                          );
                        })}
                    </div>
                  )}
                </TabsContent>

                {/* Performance Analytics Sub-Tab */}
                <TabsContent value="performance" className="space-y-6">
                  {/* How-To Guide */}
                  <GlassCard className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Track Content Performance</h3>
                        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-decimal list-inside">
                          <li><strong>Download & Post:</strong> Use the "Both" button on any bundle to download the image and copy the message</li>
                          <li><strong>Update Status:</strong> After posting to social media, change the bundle status to "Posted"</li>
                          <li><strong>Log Metrics:</strong> Click "Add Metrics" to record engagement data from your social platform</li>
                          <li><strong>Review Insights:</strong> Check the charts below to see which content types perform best</li>
                        </ol>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Key Metrics Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const postedBundles = contentBundles.filter(b => b.brand === selectedTenant && b.status === "posted" && b.metrics);
                      const totalImpressions = postedBundles.reduce((sum, b) => sum + (b.metrics?.impressions || 0), 0);
                      const totalClicks = postedBundles.reduce((sum, b) => sum + (b.metrics?.clicks || 0), 0);
                      const totalLeads = postedBundles.reduce((sum, b) => sum + (b.metrics?.leads || 0), 0);
                      const totalConversions = postedBundles.reduce((sum, b) => sum + (b.metrics?.conversions || 0), 0);
                      return (
                        <>
                          <GlassCard className="p-4 text-center" data-testid="card-total-impressions">
                            <Eye className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-impressions">{totalImpressions.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Impressions</p>
                          </GlassCard>
                          <GlassCard className="p-4 text-center" data-testid="card-total-clicks">
                            <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-clicks">{totalClicks.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Total Clicks</p>
                          </GlassCard>
                          <GlassCard className="p-4 text-center" data-testid="card-total-leads">
                            <Users className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-leads">{totalLeads}</p>
                            <p className="text-xs text-muted-foreground">Leads Generated</p>
                          </GlassCard>
                          <GlassCard className="p-4 text-center" data-testid="card-total-conversions">
                            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                            <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-conversions">{totalConversions}</p>
                            <p className="text-xs text-muted-foreground">Conversions</p>
                          </GlassCard>
                        </>
                      );
                    })()}
                  </div>

                  {/* Performance by Category */}
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-primary" />
                      Performance by Image Category
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Track which types of images resonate most with your audience. Categories with higher engagement rates should be prioritized.
                    </p>
                    {(() => {
                      const postedBundles = contentBundles.filter(b => b.brand === selectedTenant && b.status === "posted" && b.metrics);
                      const categoryData = IMAGE_SUBJECTS.map(subject => {
                        const bundles = postedBundles.filter(b => {
                          const image = allImages.find(i => i.id === b.imageId);
                          return image?.subject === subject.id;
                        });
                        const totalEngagement = bundles.reduce((sum, b) => 
                          sum + (b.metrics?.likes || 0) + (b.metrics?.comments || 0) + (b.metrics?.shares || 0), 0
                        );
                        const avgEngagement = bundles.length > 0 ? Math.round(totalEngagement / bundles.length) : 0;
                        return { name: subject.label, count: bundles.length, engagement: totalEngagement, avg: avgEngagement };
                      }).filter(d => d.count > 0);
                      
                      if (categoryData.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p>No posted content with metrics yet.</p>
                            <p className="text-xs mt-1">Post content and add metrics to see performance data.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          {categoryData.sort((a, b) => b.engagement - a.engagement).map(cat => (
                            <div key={cat.name} className="flex items-center gap-3" data-testid={`row-category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>
                              <div className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300">{cat.name}</div>
                              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                  style={{ width: `${Math.min(100, (cat.engagement / Math.max(...categoryData.map(c => c.engagement))) * 100)}%` }}
                                />
                              </div>
                              <div className="w-20 text-right text-sm">
                                <span className="font-semibold text-gray-900 dark:text-white" data-testid={`text-engagement-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>{cat.engagement}</span>
                                <span className="text-muted-foreground ml-1">eng</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </GlassCard>

                  {/* Performance by Platform */}
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Performance by Platform
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Compare results across different social platforms to focus your efforts where they have the most impact.
                    </p>
                    {(() => {
                      const postedBundles = contentBundles.filter(b => b.brand === selectedTenant && b.status === "posted" && b.metrics);
                      const platforms = ["facebook", "instagram", "nextdoor", "linkedin", "google"];
                      const platformData = platforms.map(platform => {
                        const bundles = postedBundles.filter(b => b.platform === platform || b.platform === "all");
                        const totalLeads = bundles.reduce((sum, b) => sum + (b.metrics?.leads || 0), 0);
                        const totalClicks = bundles.reduce((sum, b) => sum + (b.metrics?.clicks || 0), 0);
                        return { name: platform.charAt(0).toUpperCase() + platform.slice(1), posts: bundles.length, leads: totalLeads, clicks: totalClicks };
                      }).filter(d => d.posts > 0);
                      
                      if (platformData.length === 0) {
                        return (
                          <div className="text-center py-6 text-muted-foreground text-sm">
                            No platform data available yet.
                          </div>
                        );
                      }
                      
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {platformData.map(p => (
                            <div key={p.name} className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg" data-testid={`card-platform-${p.name.toLowerCase()}`}>
                              <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.posts} posts</p>
                              <p className="text-sm font-medium text-green-600 dark:text-green-400" data-testid={`text-leads-${p.name.toLowerCase()}`}>{p.leads} leads</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </GlassCard>

                  {/* Posted Content with Metrics */}
                  <GlassCard className="p-5">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Posted Content Log
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      All content marked as "Posted" appears here. Add metrics from your social platforms to track performance.
                    </p>
                    {(() => {
                      const postedBundles = contentBundles.filter(b => b.brand === selectedTenant && b.status === "posted");
                      if (postedBundles.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                            <p>No posted content yet.</p>
                            <p className="text-xs mt-1">Mark bundles as "Posted" after sharing on social media.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {postedBundles.map(bundle => {
                            const image = allImages.find(i => i.id === bundle.imageId);
                            const message = messageTemplates.find(m => m.id === bundle.messageId);
                            return (
                              <div key={bundle.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg" data-testid={`row-posted-bundle-${bundle.id}`}>
                                {image && (
                                  <img src={image.url} alt="" className="w-12 h-12 rounded object-cover" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 dark:text-white truncate">{message?.content.substring(0, 50)}...</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">{bundle.platform}</Badge>
                                    {bundle.postedAt && (
                                      <span className="text-xs text-muted-foreground">
                                        Posted {new Date(bundle.postedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {bundle.metrics ? (
                                  <div className="text-right text-xs">
                                    <p className="text-gray-900 dark:text-white font-medium">{bundle.metrics.impressions.toLocaleString()} views</p>
                                    <p className="text-muted-foreground">{bundle.metrics.leads} leads</p>
                                  </div>
                                ) : null}
                                <Button
                                  size="sm"
                                  variant={bundle.metrics ? "outline" : "default"}
                                  onClick={() => {
                                    setEditingMetricsBundle(bundle);
                                    setMetricsForm({
                                      impressions: bundle.metrics?.impressions || 0,
                                      reach: bundle.metrics?.reach || 0,
                                      clicks: bundle.metrics?.clicks || 0,
                                      likes: bundle.metrics?.likes || 0,
                                      comments: bundle.metrics?.comments || 0,
                                      shares: bundle.metrics?.shares || 0,
                                      saves: bundle.metrics?.saves || 0,
                                      leads: bundle.metrics?.leads || 0,
                                      conversions: bundle.metrics?.conversions || 0,
                                      spend: bundle.metrics?.spend || 0,
                                      revenue: bundle.metrics?.revenue || 0
                                    });
                                  }}
                                  data-testid={`button-edit-metrics-${bundle.id}`}
                                >
                                  {bundle.metrics ? "Edit" : "Add Metrics"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </GlassCard>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* GETTING STARTED GUIDE TAB - Now moved to Playbook */}
            <TabsContent value="guide" className="space-y-6" data-testid="guide-tab-content">
              {/* Welcome Header */}
              <div className="p-6 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] rounded-md text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-md bg-white/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Marketing Hub Guide</h2>
                    <p className="text-white/90 text-sm">Your complete walkthrough to mastering this system</p>
                  </div>
                </div>
                <div className="p-4 bg-white/10 rounded-md">
                  <p className="text-sm leading-relaxed">
                    {selectedTenant === "lumepaint" || selectedTenant === "lume" ? (
                      <>Welcome to your Marketing Hub - built to help you <strong>"Elevating the backdrop of your life"</strong> through professional, consistent marketing. This system is designed to work just like the tools you already use, making the transition smooth and intuitive.</>
                    ) : (
                      <>Welcome to your Marketing Hub - built to help you <strong>"Transforming familiar spaces into extraordinary places"</strong> through professional, consistent marketing. This system is designed to work just like the tools you already use, making the transition smooth and intuitive.</>
                    )}
                  </p>
                </div>
              </div>

              {/* The Big Picture */}
              <GlassCard className="p-6 border-l-4 border-l-red-500">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                  <Target className="w-5 h-5" />
                  The Big Picture
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This Marketing Hub is your <strong>central command center</strong> for all marketing activities. Right now, you will manually input content - but this is intentional. It gives you time to:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">1</span>
                        </div>
                        <span className="font-semibold text-red-700 dark:text-red-300">Learn the System</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Get familiar with how everything works before we connect live data</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">2</span>
                        </div>
                        <span className="font-semibold text-red-700 dark:text-red-300">Build Your Library</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Create posts, images, and messages that reflect your brand</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">3</span>
                        </div>
                        <span className="font-semibold text-red-700 dark:text-red-300">Connect Later</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Once ready, we will link to Meta Business Suite, Google Ads, and more</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Integration Roadmap */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Link className="w-5 h-5 text-red-500" />
                  How It Connects to What You Already Use
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This system was designed to <strong>mimic the platforms you are already familiar with</strong>. Once integrated, it will pull data from and push content to:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-2">
                      <Facebook className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-semibold">Meta Business Suite</p>
                        <p className="text-xs text-muted-foreground">Facebook + Instagram posting</p>
                      </div>
                      <Badge className="ml-auto bg-yellow-100 text-yellow-700 text-xs">Coming Soon</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Currently: Post manually via Meta. Soon: Schedule directly from here.</p>
                  </div>
                  <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-6 h-6 text-red-500" />
                      <div>
                        <p className="font-semibold">Google Ads</p>
                        <p className="text-xs text-muted-foreground">Campaign cost tracking</p>
                      </div>
                      <Badge className="ml-auto bg-yellow-100 text-yellow-700 text-xs">Coming Soon</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Currently: Enter costs manually. Soon: Auto-sync spend and ROI.</p>
                  </div>
                  <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold">Google Local Services</p>
                        <p className="text-xs text-muted-foreground">LSA lead tracking</p>
                      </div>
                      <Badge className="ml-auto bg-green-100 text-green-700 text-xs">Connected</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Already integrated! Leads from LSA flow into your system.</p>
                  </div>
                  <div className="p-4 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="font-semibold">Google Analytics</p>
                        <p className="text-xs text-muted-foreground">Website visitor tracking</p>
                      </div>
                      <Badge className="ml-auto bg-green-100 text-green-700 text-xs">Connected</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Already integrated! See visitor data in Analytics tab.</p>
                  </div>
                </div>
              </GlassCard>

              {/* Section-by-Section Walkthrough */}
              <GlassCard className="p-6 border-l-4 border-l-red-500">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                  <Play className="w-5 h-5" />
                  Section-by-Section Walkthrough
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click any section below to jump directly to it and explore. Each section is designed to be intuitive - if you have used social media scheduling tools before, this will feel familiar.
                </p>
                
                <div className="space-y-3">
                  {/* Content Studio Link */}
                  <div 
                    className="p-4 rounded-md border border-gray-200 dark:border-gray-700 hover-elevate cursor-pointer flex items-center gap-4"
                    onClick={() => setActiveTab("content")}
                    data-testid="guide-link-content"
                  >
                    <div className="w-10 h-10 rounded-md bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Content Studio</p>
                      <p className="text-xs text-muted-foreground">Images, messages, and content bundles - all your marketing assets</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Analytics Link */}
                  <div 
                    className="p-4 rounded-md border border-gray-200 dark:border-gray-700 hover-elevate cursor-pointer flex items-center gap-4"
                    onClick={() => setActiveTab("analytics")}
                    data-testid="guide-link-analytics"
                  >
                    <div className="w-10 h-10 rounded-md bg-green-500 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Analytics Center</p>
                      <p className="text-xs text-muted-foreground">Track your marketing performance with clear explanations</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Calendar/Schedule Link */}
                  <div 
                    className="p-4 rounded-md border border-gray-200 dark:border-gray-700 hover-elevate cursor-pointer flex items-center gap-4"
                    onClick={() => setActiveTab("calendar")}
                    data-testid="guide-link-calendar"
                  >
                    <div className="w-10 h-10 rounded-md bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Schedule</p>
                      <p className="text-xs text-muted-foreground">Plan your posts on a weekly calendar - see whats going out when</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Analytics Link */}
                  <div 
                    className="p-4 rounded-md border border-gray-200 dark:border-gray-700 hover-elevate cursor-pointer flex items-center gap-4"
                    onClick={() => setActiveTab("analytics")}
                    data-testid="guide-link-analytics"
                  >
                    <div className="w-10 h-10 rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Analytics</p>
                      <p className="text-xs text-muted-foreground">Website traffic, visitor stats, and SEO performance data</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Playbook Link */}
                  <div 
                    className="p-4 rounded-md border border-gray-200 dark:border-gray-700 hover-elevate cursor-pointer flex items-center gap-4"
                    onClick={() => setActiveTab("playbook")}
                    data-testid="guide-link-playbook"
                  >
                    <div className="w-10 h-10 rounded-md bg-yellow-500 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Playbook</p>
                      <p className="text-xs text-muted-foreground">Marketing psychology strategies and proven tactics that drive action</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700 text-xs mr-2">New</Badge>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </GlassCard>

              {/* Key Takeaways */}
              <GlassCard className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border-2 border-red-200 dark:border-red-800">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                  <CheckCircle className="w-5 h-5" />
                  Key Takeaways
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Not a new language</p>
                      <p className="text-xs text-muted-foreground">This mirrors tools you already use - just better organized</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Manual input is intentional</p>
                      <p className="text-xs text-muted-foreground">Learn the system now, connect to live data when ready</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Everything connects</p>
                      <p className="text-xs text-muted-foreground">Meta, Google, analytics - all will flow through one hub</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Start exploring</p>
                      <p className="text-xs text-muted-foreground">Click the sections above to dive in and get comfortable</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Voice Mode Reminder */}
              <div className="p-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md text-white flex items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Voice Mode Available</p>
                  <p className="text-xs text-white/90">Toggle voice mode in any tab to hear content read aloud while you multitask</p>
                </div>
              </div>
            </TabsContent>

            {/* OVERVIEW TAB - Welcome, Status, Roadmap */}
            <TabsContent value="overview" className="space-y-6">
              {/* Voice Assistant Tip - First thing Logan sees */}
              <div className="p-3 md:p-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs md:text-sm">Voice Mode Available</p>
                    <p className="text-xs text-white/90 line-clamp-2">
                      Click the speaker icon on any section to have the AI read it to you.
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs flex-shrink-0"
                  onClick={() => handleReadSection("welcome")}
                  data-testid="button-voice-demo"
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  Try It
                </Button>
              </div>

              {/* Intro Toggle - Show/Hide all intro content */}
              {introHidden ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">Welcome guide hidden</p>
                      <p className="text-xs text-muted-foreground">You've read the intro.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={showIntro} data-testid="button-show-intro" className="text-xs flex-shrink-0">
                    Show Guide
                  </Button>
                </div>
              ) : (
                <>
                  {/* Welcome Section for Logan */}
                  <GlassCard className="p-4 md:p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
                    <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                          Hey Logan - Here's What I Built For Us
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-relaxed">
                          This is our Marketing Hub for {selectedTenant === "npp" ? "Nashville Painting Professionals" : "Paint Pros Co"}. 
                          I've been building this system so we can run a professional marketing operation together without 
                          either of us having to spend hours on it.
                        </p>
                      </div>
                    </div>
                  </GlassCard>

              {/* Section 1: What's Ready */}
              <GlassCard className="p-4 md:p-6">
                <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  1. What's Ready Right Now
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="ml-auto h-8 w-8"
                    onClick={() => handleReadSection("section1")}
                    data-testid="button-read-section1"
                  >
                    {isReading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">100+ Marketing Images</p>
                      <p className="text-xs text-gray-500">Digital Asset Library across 14 categories</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Content Catalog</p>
                      <p className="text-xs text-gray-500">Evergreen + Seasonal posts ready to schedule</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Scheduling Calendar</p>
                      <p className="text-xs text-gray-500">4-week duplicate prevention built in</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Analytics Dashboard</p>
                      <p className="text-xs text-gray-500">Weekly trends, KPIs, performance insights</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Team Notes</p>
                      <p className="text-xs text-gray-500">Leave messages for the team, stay in sync</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Meta Business Suite Integration Roadmap */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  AI Marketing Autopilot - Roadmap
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Our goal: Set it and forget it. The system posts automatically while you focus on what matters.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-l-4 border-blue-500">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-300 font-bold text-sm">1</div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Meta Business Suite Integration</p>
                      <p className="text-xs text-gray-500 mt-1">Connect Facebook + Instagram via Meta Graph API. Auto-post from your content library.</p>
                      <Badge className="mt-2 bg-yellow-100 text-yellow-700 text-xs">Coming Soon</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-l-4 border-purple-500">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-300 font-bold text-sm">2</div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">AI Content Generation</p>
                      <p className="text-xs text-gray-500 mt-1">AI writes captions using your brand voice. "Transforming familiar spaces..." for NPP.</p>
                      <Badge className="mt-2 bg-yellow-100 text-yellow-700 text-xs">Coming Soon</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-l-4 border-green-500">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0 text-green-600 dark:text-green-300 font-bold text-sm">3</div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Smart Carousel Scheduler</p>
                      <p className="text-xs text-gray-500 mt-1">System rotates through content automatically. You just send a message when updating.</p>
                      <Badge className="mt-2 bg-yellow-100 text-yellow-700 text-xs">Coming Soon</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border-l-4 border-orange-500">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center flex-shrink-0 text-orange-600 dark:text-orange-300 font-bold text-sm">4</div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Platform Expansion</p>
                      <p className="text-xs text-gray-500 mt-1">Start with Facebook/Instagram. Add X (Twitter) when franchising goes national.</p>
                      <Badge className="mt-2 bg-gray-100 text-gray-600 text-xs">Future</Badge>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Google Analytics Integration */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  Google Analytics Integration
                </h3>
                <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Awaiting Authorization Code</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Once we receive the Google Analytics authorization code, this section will display:
                    </p>
                    <ul className="text-xs text-gray-500 mt-2 space-y-1 list-disc list-inside">
                      <li>Live visitor tracking</li>
                      <li>Traffic sources breakdown</li>
                      <li>Lead conversion metrics</li>
                      <li>Campaign performance (UTM tracking)</li>
                    </ul>
                    <Badge className="mt-3 bg-orange-100 text-orange-700 text-xs">Ready to Connect</Badge>
                  </div>
                </div>
              </GlassCard>

              {/* Section 2: How To Operate It */}
              <GlassCard className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  2. How To Operate It (Your Tasks)
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="ml-auto h-8 w-8"
                    onClick={() => handleReadSection("section2")}
                    data-testid="button-read-section2"
                  >
                    {isReading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  The system is built and ready to go. Now I need your help running it. These are your responsibilities 
                  to keep the marketing machine operating at maximum effectiveness:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-l-4 border-green-500">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Review AI Captions
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      When the AI generates content, review it before it goes live. Does it sound like NPP? 
                      Your approval ensures brand voice stays consistent.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-l-4 border-blue-500">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      Spot Trends
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      You're on social media daily. When you see trending formats or ideas that could work 
                      for a painting company, flag them. This keeps our content fresh and relevant.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      Monitor Engagement
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Check the Analytics tab weekly. Note which posts are winning and which are underperforming. 
                      This data drives our optimization decisions.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border-l-4 border-pink-500">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-pink-500" />
                      Curate the Library
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Browse the Content Catalog regularly. Flag outdated images, suggest new pairings, 
                      and keep the library fresh. Quality in = quality out.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Your role is critical:</strong> The AI handles the heavy lifting, but your eyes on the system 
                    ensure we catch issues early and stay ahead of the competition. Together, we're running a marketing 
                    operation that most small businesses can't afford.
                  </p>
                </div>
              </GlassCard>

              {/* AI Marketing Assistant - Proactive & Productive */}
              <GlassCard className="p-6 bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20 border-indigo-200 dark:border-indigo-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  AI Marketing Assistant
                  <Badge className="ml-2 bg-indigo-100 text-indigo-700 text-xs">Proactive Mode</Badge>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  This isn't just a chatbot - it's a working assistant that actually does things for you.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center gap-2 mb-2">
                      <PenTool className="w-4 h-4 text-indigo-500" />
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Content Suggestions</p>
                    </div>
                    <p className="text-xs text-gray-500">AI analyzes your best-performing posts and generates new caption ideas matching your brand voice.</p>
                    <Badge className="mt-2 bg-green-100 text-green-700 text-xs">Active</Badge>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Smart Scheduling</p>
                    </div>
                    <p className="text-xs text-gray-500">Recommends optimal posting times based on engagement data. Prevents duplicate content automatically.</p>
                    <Badge className="mt-2 bg-green-100 text-green-700 text-xs">Active</Badge>
                  </div>
                  
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-orange-100 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Performance Alerts</p>
                    </div>
                    <p className="text-xs text-gray-500">Notifies you when posts underperform or when engagement spikes. Suggests improvements automatically.</p>
                    <Badge className="mt-2 bg-yellow-100 text-yellow-700 text-xs">Coming Soon</Badge>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">What This Means For You</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        The AI doesn't just answer questions - it actively works. When you're busy with school, the AI is:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-300 mt-2 space-y-1 list-disc list-inside">
                        <li>Analyzing which posts perform best and why</li>
                        <li>Generating new content ideas based on what works</li>
                        <li>Keeping the carousel running with fresh content</li>
                        <li>Flagging anything that needs human attention</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Section 3: What I'm Still Connecting */}
              <GlassCard className="p-6 border-2 border-blue-300 dark:border-blue-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                  3. What I'm Still Connecting
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="ml-auto h-8 w-8"
                    onClick={() => handleReadSection("section3")}
                    data-testid="button-read-section3"
                  >
                    {isReading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </h3>
                
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Step 1: Manual Rotation (Current)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      Setting up the first content rotation manually to establish the baseline. This ensures we have proven content 
                      and timing patterns before the AI takes over. You'll see the calendar populate with our initial schedule.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Step 2: Meta API Connection (In Progress)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      Working on getting the direct API connection to Meta (Facebook/Instagram) set up. 
                      This will allow the system to post automatically without anyone logging into Meta Business Suite.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Step 3: Full Automation (Coming Next)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      Once Meta is connected and manual rotation is proven, the AI takes over completely. 
                      The carousel runs 24/7 and you just get notified when something needs attention.
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
                  Once fully connected, you'll be able to:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 mt-2 space-y-1 list-disc list-inside">
                  <li>Post directly to Facebook & Instagram from this dashboard</li>
                  <li>See all analytics in one place - no switching apps</li>
                  <li>Schedule and automate posts with AI assistance</li>
                  <li>Run the entire marketing operation right here</li>
                </ul>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 font-medium">
                  Until then, explore the Content Catalog and Analytics tabs. The foundation is ready!
                </p>
              </GlassCard>

              {/* Section 4: Where We're Headed */}
              <GlassCard className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-500" />
                  4. Where We're Headed (The Vision)
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="ml-auto h-8 w-8"
                    onClick={() => handleReadSection("section4")}
                    data-testid="button-read-section4"
                  >
                    {isReading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Once implementation becomes normal, here's what our Marketing AI will handle automatically:
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-cyan-500" />
                      Voice Commands (Coming Soon)
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <p className="italic">"Generate a post about spring exterior painting"</p>
                      <p className="italic">"Schedule the deck staining post for Tuesday at 10am"</p>
                      <p className="italic">"What content hasn't been used in 30 days?"</p>
                      <p className="italic">"Show me our best performing posts this month"</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      Auto-Calendar Population
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Once Meta is connected, the AI will automatically populate your posting calendar based on:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-300 mt-2 space-y-1 list-disc list-inside">
                      <li>Optimal posting times from your analytics data</li>
                      <li>Seasonal relevance (spring cleaning, summer decks, holiday prep)</li>
                      <li>Content rotation to prevent staleness</li>
                      <li>Platform-specific best practices (Instagram vs Facebook vs Nextdoor)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Smart Ad Timing
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      When Meta integration is live, the AI will run ads at the right times:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-300 mt-2 space-y-1 list-disc list-inside">
                      <li>Boost high-performing organic posts automatically</li>
                      <li>Target peak engagement windows based on your audience</li>
                      <li>Adjust spend based on lead response rates</li>
                      <li>Pause underperforming ads before they waste budget</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg">
                  <p className="text-xs text-cyan-800 dark:text-cyan-200">
                    <strong>Bottom Line:</strong> You focus on school. The AI keeps the marketing machine running. 
                    Just check in occasionally and send a quick message if you're updating anything.
                  </p>
                </div>
              </GlassCard>

              {/* Section 5: How We Stay In Sync */}
              <GlassCard className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  5. How We Stay In Sync
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="ml-auto h-8 w-8"
                    onClick={() => handleReadSection("section5")}
                    data-testid="button-read-section5"
                  >
                    {isReading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </h3>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl mb-4">
                  <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Use the Notes Tab
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    The <strong>Notes</strong> tab is where we leave messages for each other. Quick updates, reminders, ideas - all in one place.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white">When you update content:</p>
                    <p className="text-gray-600 dark:text-gray-300 text-xs">Post a note: "Hey, updated next week's Nextdoor post."</p>
                  </div>
                  <div className="space-y-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white">When I update content:</p>
                    <p className="text-gray-600 dark:text-gray-300 text-xs">I'll post: "Got it, scheduled for next week. Also added spring promo content."</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    The goal is efficiency. Everyone sees the notes, everyone stays in the loop. 
                    The system runs like a carousel - it never stops.
                  </p>
                </div>
              </GlassCard>

                  {/* Dismiss Intro Button */}
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={hideIntro}
                      className="text-muted-foreground"
                      data-testid="button-hide-intro"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Got it - Hide this guide
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* IMAGES TAB - Image Library with Tags */}
            <TabsContent value="images" className="space-y-6">
              <GlassCard className="p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-purple-500" />
                      Image Library
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tagged images that the AI can match with message templates
                    </p>
                  </div>
                  <Button onClick={() => setShowAddImageModal(true)} data-testid="button-add-image">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Image
                  </Button>
                </div>
                
                {/* Live vs AI Library Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
                  <button
                    onClick={() => setImageLibraryTab("live")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      imageLibraryTab === "live" 
                        ? "bg-green-500 text-white shadow-sm" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    data-testid="button-live-images-tab"
                  >
                    <Camera className="w-4 h-4" />
                    Live Images ({allImages.filter(img => img.brand === selectedTenant && img.isUserUploaded).length})
                  </button>
                  <button
                    onClick={() => setImageLibraryTab("ai")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      imageLibraryTab === "ai" 
                        ? "bg-purple-500 text-white shadow-sm" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    data-testid="button-ai-library-tab"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Library ({allImages.filter(img => img.brand === selectedTenant && !img.isUserUploaded).length})
                  </button>
                </div>

                {/* Description based on selected tab */}
                {imageLibraryTab === "live" ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Real photos from your jobs - these are used FIRST for marketing posts
                    </p>
                  </div>
                ) : (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                    <p className="text-sm text-purple-800 dark:text-purple-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI-generated placeholder images - replace these with real job photos
                    </p>
                  </div>
                )}
                
                {/* Subject Filter Carousel */}
                <div className="overflow-x-auto pb-2 -mx-2 px-2">
                  <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                    <button
                      onClick={() => setImageSubjectFilter("all")}
                      className={`relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden group transition-all ${
                        imageSubjectFilter === "all" ? "ring-2 ring-[#1e3a5f] ring-offset-2" : ""
                      }`}
                      data-testid="images-filter-all-subjects"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
                        <LayoutGrid className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-end p-1.5">
                        <span className="text-white text-xs font-medium drop-shadow-lg">All</span>
                      </div>
                    </button>
                    {IMAGE_SUBJECTS.map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => setImageSubjectFilter(subject.id)}
                        className={`relative flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden group transition-all ${
                          imageSubjectFilter === subject.id ? "ring-2 ring-[#1e3a5f] ring-offset-2" : ""
                        }`}
                        data-testid={`images-filter-${subject.id}`}
                      >
                        <img 
                          src={subject.image} 
                          alt={subject.label} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/60 transition-colors flex items-end p-1.5">
                          <span className="text-white text-xs font-medium drop-shadow-lg leading-tight">{subject.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Display images based on selected tab */}
              {(() => {
                const filteredImages = allImages
                  .filter(img => img.brand === selectedTenant)
                  .filter(img => imageLibraryTab === "live" ? img.isUserUploaded : !img.isUserUploaded)
                  .filter(img => imageSubjectFilter === "all" || img.subject === imageSubjectFilter);
                
                if (filteredImages.length === 0) {
                  return (
                    <GlassCard className="p-8 text-center">
                      <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {imageLibraryTab === "live" ? "No Live Images Yet" : "No AI Images"}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {imageLibraryTab === "live" 
                          ? "Upload photos from completed jobs using the Field Tool or add them here manually."
                          : "No AI-generated placeholder images in this category."
                        }
                      </p>
                      {imageLibraryTab === "live" && (
                        <Button onClick={() => setShowAddImageModal(true)} data-testid="button-add-first-image">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Your First Live Image
                        </Button>
                      )}
                    </GlassCard>
                  );
                }
                
                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredImages.map(img => (
                      <GlassCard key={img.id} className="p-2 overflow-hidden" data-testid={`card-library-image-${img.id}`}>
                        <img src={img.url} alt={img.description} className="w-full h-32 object-cover rounded-lg mb-2" />
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{img.description}</p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs">{IMAGE_SUBJECTS.find(s => s.id === img.subject)?.label || img.subject}</Badge>
                            <Badge variant="outline" className="text-xs">{img.style}</Badge>
                            {img.isUserUploaded && (
                              <Badge className="text-xs bg-green-500/20 text-green-600 border-green-500/30">Real Photo</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star key={n} className={`w-3 h-3 ${n <= img.quality ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                );
              })()}
            </TabsContent>

            {/* MESSAGES TAB - Message Templates with Tags */}
            <TabsContent value="messages" className="space-y-6">
              <GlassCard className="p-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Message Templates
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Captions and messages the AI can pair with matching images
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={messageSubjectFilter} onValueChange={setMessageSubjectFilter}>
                      <SelectTrigger className="w-40" data-testid="select-message-subject">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {IMAGE_SUBJECTS.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowAddMessageModal(true)} data-testid="button-add-message">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Message
                    </Button>
                  </div>
                </div>
              </GlassCard>

              {/* Gamification Templates - Engagement Hooks */}
              <GlassCard className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-700">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-gray-900 dark:text-white">Engagement Boosters</h4>
                  <Badge variant="secondary" className="text-xs">Quick Add</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                  One-click gamification templates to boost engagement. These challenge-style posts encourage comments and shares.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { 
                      title: "Guess the Before Color", 
                      IconComponent: Search,
                      content: "Can you guess what color this room was BEFORE our team worked their magic? Drop your guess in the comments - we'll reveal the answer tomorrow! Hint: It wasn't pretty.",
                      subject: "before-after" as ImageSubject
                    },
                    { 
                      title: "Spot the Difference", 
                      IconComponent: Eye,
                      content: "We made 3 changes to this space beyond the paint color. Can you spot them all? First person to get all 3 wins a $25 gift card! (Look closely at the trim, lighting, and one more surprise...)",
                      subject: "interior-walls" as ImageSubject
                    },
                    { 
                      title: "Color Challenge", 
                      IconComponent: Palette,
                      content: "What would YOU name this color? Wrong answers only! Our team calls it 'Monday Morning Coffee' but we want to hear your creative names. Best answer gets featured in our next post!",
                      subject: "interior-walls" as ImageSubject
                    },
                    { 
                      title: "This or That", 
                      IconComponent: Lightbulb,
                      content: "Which style speaks to you? A) Bold and dramatic accent walls B) Soft and subtle neutrals. Vote with A or B in the comments! We're curious what our neighbors prefer.",
                      subject: "general" as ImageSubject
                    },
                    { 
                      title: "Rate This Transform", 
                      IconComponent: Star,
                      content: "On a scale of 1-10, how would you rate this transformation? Be honest! We love feedback from our community. Drop your rating and tell us what you think!",
                      subject: "before-after" as ImageSubject
                    },
                    { 
                      title: "Caption This", 
                      IconComponent: PenTool,
                      content: "Caption contest time! Give us your best caption for this transformation. Funniest answer wins bragging rights AND a shoutout in our next post. Ready, set, caption!",
                      subject: "before-after" as ImageSubject
                    }
                  ].map((template, idx) => (
                    <Button 
                      key={idx}
                      variant="outline" 
                      size="sm"
                      className="justify-start text-left h-auto py-2 px-3"
                      onClick={() => {
                        const newMessage: MessageTemplate = {
                          id: `msg-gamify-${Date.now()}-${idx}`,
                          brand: selectedTenant,
                          content: template.content,
                          subject: template.subject,
                          tone: "friendly" as MessageTone,
                          cta: "none" as MessageCTA,
                          platform: "all",
                          hashtags: ["engagement", "community", "fun"],
                          createdAt: new Date().toISOString(),
                        };
                        const updated = [...messageTemplates, newMessage];
                        setMessageTemplates(updated);
                        localStorage.setItem("marketing_messages", JSON.stringify(updated));
                      }}
                      data-testid={`button-gamify-${idx}`}
                    >
                      <div className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-800 flex items-center justify-center mr-2 flex-shrink-0">
                        <template.IconComponent className="w-3 h-3 text-amber-700 dark:text-amber-200" />
                      </div>
                      <span className="text-xs">{template.title}</span>
                    </Button>
                  ))}
                </div>
              </GlassCard>

              {/* Educational Posts - Tips & Knowledge */}
              <GlassCard className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-gray-900 dark:text-white">Educational Posts</h4>
                  <Badge variant="secondary" className="text-xs">Quick Add</Badge>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
                  Share your expertise! Educational content builds trust and positions you as the go-to painting professional.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { 
                      title: "Prep is Everything", 
                      IconComponent: Layers,
                      content: "Pro tip: 80% of a great paint job happens BEFORE the brush touches the wall. Proper prep includes cleaning, sanding, priming, and taping. Skip these steps and you'll see it in the finish. Here's what our prep process looks like...",
                      subject: "general" as ImageSubject
                    },
                    { 
                      title: "Paint Sheen Guide", 
                      IconComponent: Sparkles,
                      content: "Choosing the right sheen matters! Flat = hides imperfections (ceilings), Eggshell = low sheen (living rooms), Satin = easy clean (kitchens/baths), Semi-gloss = durable (trim/doors), Gloss = high shine (cabinets). Save this for your next project!",
                      subject: "general" as ImageSubject
                    },
                    { 
                      title: "Color Psychology", 
                      IconComponent: Palette,
                      content: "Did you know colors affect your mood? Blue = calm & productive (perfect for offices). Yellow = energizing (great for kitchens). Green = relaxing (ideal for bedrooms). What feeling do you want in your space? We can help you choose!",
                      subject: "interior-walls" as ImageSubject
                    },
                    { 
                      title: "When to Repaint", 
                      IconComponent: Clock,
                      content: "How often should you repaint? Interior walls: 5-7 years. High-traffic areas: 2-3 years. Exterior: 5-10 years (depending on climate). Cabinets: 3-5 years. Notice peeling, fading, or chalking? It's time! DM us for a free assessment.",
                      subject: "exterior-home" as ImageSubject
                    },
                    { 
                      title: "DIY vs Pro", 
                      IconComponent: Users,
                      content: "When to DIY vs hire a pro: DIY for small touch-ups and accent walls. Call the pros for high ceilings, exteriors, cabinets, and lead paint. We see DIY disasters every week - save yourself the headache (and ladder injuries). Questions? We're here to help!",
                      subject: "general" as ImageSubject
                    },
                    { 
                      title: "Seasonal Tips", 
                      IconComponent: Calendar,
                      content: "Best time to paint? Spring and fall are ideal - moderate temps (50-85°F) help paint cure properly. Summer heat can cause bubbling. Winter cold prevents proper adhesion. Planning a project? Book now for the perfect painting weather!",
                      subject: "exterior-home" as ImageSubject
                    },
                    { 
                      title: "Cabinet Care", 
                      IconComponent: Home,
                      content: "Painted cabinets looking tired? Here's how to keep them fresh: Clean with mild soap monthly. Avoid harsh chemicals. Touch up chips immediately. Keep humidity controlled. With proper care, painted cabinets last 8-10 years!",
                      subject: "cabinet-work" as ImageSubject
                    },
                    { 
                      title: "Color Trends", 
                      IconComponent: TrendingUp,
                      content: "2024 Color Trends: Warm neutrals are IN (think greige, warm white, soft beige). Bold accent walls in deep blues and forest greens. Black trim is having a moment! What color are you considering? Drop it below!",
                      subject: "interior-walls" as ImageSubject
                    },
                    { 
                      title: "Deck Maintenance", 
                      IconComponent: TreePine,
                      content: "Deck looking rough? Here's the fix: Power wash gently. Let dry 48+ hours. Apply quality stain/sealer. Recoat every 2-3 years. Pro tip: Stain in shade, not direct sun! Need help? We've got you covered.",
                      subject: "deck-staining" as ImageSubject
                    }
                  ].map((template, idx) => (
                    <Button 
                      key={idx}
                      variant="outline" 
                      size="sm"
                      className="justify-start text-left h-auto py-2 px-3"
                      onClick={() => {
                        const newMessage: MessageTemplate = {
                          id: `msg-edu-${Date.now()}-${idx}`,
                          brand: selectedTenant,
                          content: template.content,
                          subject: template.subject,
                          tone: "professional" as MessageTone,
                          cta: "none" as MessageCTA,
                          platform: "all",
                          hashtags: ["paintingtips", "protips", "homeimprovement"],
                          createdAt: new Date().toISOString(),
                        };
                        const updated = [...messageTemplates, newMessage];
                        setMessageTemplates(updated);
                        localStorage.setItem("marketing_messages", JSON.stringify(updated));
                      }}
                      data-testid={`button-edu-${idx}`}
                    >
                      <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-800 flex items-center justify-center mr-2 flex-shrink-0">
                        <template.IconComponent className="w-3 h-3 text-blue-700 dark:text-blue-200" />
                      </div>
                      <span className="text-xs">{template.title}</span>
                    </Button>
                  ))}
                </div>
              </GlassCard>

              {messageTemplates.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Message Templates Yet</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Add message templates with subject tags. The AI will match these with images that share the same subject.
                  </p>
                  <Button onClick={() => setShowAddMessageModal(true)} data-testid="button-add-first-message">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Your First Message
                  </Button>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {messageTemplates
                    .filter(msg => msg.brand === selectedTenant)
                    .filter(msg => messageSubjectFilter === "all" || msg.subject === messageSubjectFilter)
                    .map(msg => (
                      <GlassCard key={msg.id} className="p-4" data-testid={`card-message-template-${msg.id}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-white mb-2">{msg.content}</p>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary">{IMAGE_SUBJECTS.find(s => s.id === msg.subject)?.label}</Badge>
                              <Badge variant="outline">{MESSAGE_TONES.find(t => t.id === msg.tone)?.label}</Badge>
                              {msg.cta !== "none" && <Badge className="bg-green-100 text-green-800">{MESSAGE_CTAS.find(c => c.id === msg.cta)?.label}</Badge>}
                              {msg.hashtags.length > 0 && <Badge variant="outline" className="text-blue-600">{msg.hashtags.length} hashtags</Badge>}
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" data-testid={`button-edit-message-${msg.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </GlassCard>
                    ))}
                </div>
              )}
            </TabsContent>

            {/* AI BUNDLES TAB - Smart Matching */}
            <TabsContent value="bundles" className="space-y-6">
              <GlassCard className="p-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Wand2 className="w-5 h-5 text-pink-500" />
                      AI Content Bundles
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Smart image + message combinations created by AI based on matching tags
                    </p>
                  </div>
                  <Button 
                    onClick={async () => {
                      setIsGeneratingMatch(true);
                      // AI matching logic - match images with messages by subject
                      const tenantImages = allImages.filter(img => img.brand === selectedTenant);
                      const tenantMessages = messageTemplates.filter(msg => msg.brand === selectedTenant);
                      const newBundles: ContentBundle[] = [];
                      
                      for (const image of tenantImages) {
                        const matchingMessages = tenantMessages.filter(msg => msg.subject === image.subject);
                        for (const msg of matchingMessages) {
                          // Check if this combination already exists
                          const exists = contentBundles.some(b => b.imageId === image.id && b.messageId === msg.id);
                          if (!exists) {
                            newBundles.push({
                              id: `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              imageId: image.id,
                              messageId: msg.id,
                              brand: selectedTenant,
                              platform: msg.platform,
                              status: "suggested",
                              postType: "organic",
                              createdAt: new Date().toISOString(),
                            });
                          }
                        }
                      }
                      
                      const updated = [...contentBundles, ...newBundles];
                      setContentBundles(updated);
                      localStorage.setItem("marketing_bundles", JSON.stringify(updated));
                      setIsGeneratingMatch(false);
                    }}
                    disabled={isGeneratingMatch || allImages.length === 0 || messageTemplates.length === 0}
                    data-testid="button-generate-bundles"
                  >
                    {isGeneratingMatch ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-1" />
                        Generate Bundles
                      </>
                    )}
                  </Button>
                </div>
              </GlassCard>

              {(libraryImages.length === 0 || messageTemplates.length === 0) ? (
                <GlassCard className="p-8 text-center">
                  <Layers className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add Content First</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    You need both images and message templates before the AI can create bundles. 
                    Add at least one image and one message to get started.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => setActiveTab("content")}>
                      <Layers className="w-4 h-4 mr-1" />
                      Go to Content Studio
                    </Button>
                  </div>
                </GlassCard>
              ) : contentBundles.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <Wand2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to Generate</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Click "Generate Bundles" to have the AI create smart image + message combinations based on matching subject tags.
                  </p>
                </GlassCard>
              ) : (
                <div className="space-y-4">
                  {contentBundles
                    .filter(b => b.brand === selectedTenant)
                    .map(bundle => {
                      const image = allImages.find(i => i.id === bundle.imageId);
                      const message = messageTemplates.find(m => m.id === bundle.messageId);
                      return (
                        <GlassCard key={bundle.id} className="p-4" data-testid={`card-content-bundle-${bundle.id}`}>
                          <div className="flex gap-4">
                            {image && (
                              <img src={image.url} alt="" className="w-24 h-24 object-cover rounded-lg" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={bundle.status === "approved" ? "bg-green-500" : bundle.status === "suggested" ? "bg-yellow-500" : "bg-blue-500"}>
                                  {bundle.status}
                                </Badge>
                                <Badge variant="outline">{bundle.platform}</Badge>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white mb-2" data-testid={`text-bundle-content-${bundle.id}`}>{message?.content}</p>
                              {bundle.status === "suggested" && (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="bg-green-500"
                                    data-testid={`button-approve-bundle-${bundle.id}`}
                                    onClick={() => {
                                      const updated = contentBundles.map(b => 
                                        b.id === bundle.id ? { ...b, status: "approved" as const } : b
                                      );
                                      setContentBundles(updated);
                                      localStorage.setItem("marketing_bundles", JSON.stringify(updated));
                                    }}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="outline" data-testid={`button-edit-bundle-${bundle.id}`}>
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      );
                    })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="catalog" className="space-y-6">
              <GlassCard className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Search messages..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-posts"
                    />
                  </div>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger className="w-full md:w-40" data-testid="select-platform">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="nextdoor">Nextdoor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-40" data-testid="select-type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="evergreen">Evergreen</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-40" data-testid="select-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setShowAddModal(true)} data-testid="button-add-post">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Post
                  </Button>
                </div>
              </GlassCard>

              <div className="grid gap-4">
                <AnimatePresence>
                  {filteredPosts.map((post, index) => {
                    const platform = PLATFORMS.find(p => p.id === post.platform);
                    const category = CATEGORIES.find(c => c.id === post.category);
                    const recentlyUsed = checkDuplicateUsage(post);
                    
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <GlassCard className={`p-4 ${recentlyUsed ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platform?.color} flex items-center justify-center`}>
                                  {platform && <platform.icon className="w-4 h-4 text-white" />}
                                </div>
                                <Badge variant={post.type === "evergreen" ? "default" : "secondary"}>
                                  {post.type}
                                </Badge>
                                <Badge variant="outline">
                                  {category?.label}
                                </Badge>
                                {post.status === "scheduled" && (
                                  <Badge className="bg-blue-500">Scheduled</Badge>
                                )}
                                {post.status === "posted" && (
                                  <Badge className="bg-green-500">Posted</Badge>
                                )}
                                {recentlyUsed && (
                                  <Badge variant="outline" className="border-orange-400 text-orange-600">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Used Recently
                                  </Badge>
                                )}
                                {post.claimedBy && (
                                  <Badge variant="outline" className="border-purple-400 text-purple-600">
                                    <User className="w-3 h-3 mr-1" />
                                    {post.claimedBy}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-800 dark:text-gray-200">{post.content}</p>
                              {post.lastUsed && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Last used: {format(new Date(post.lastUsed), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  navigator.clipboard.writeText(post.content);
                                }}
                                title="Copy to clipboard"
                                data-testid={`button-copy-${post.id}`}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingPost(post)}
                                title="Edit post"
                                data-testid={`button-edit-${post.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markAsPosted(post.id)}
                                title="Mark as posted"
                                data-testid={`button-posted-${post.id}`}
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => deletePost(post.id)}
                                title="Delete post"
                                data-testid={`button-delete-${post.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredPosts.length === 0 && (
                  <GlassCard className="p-12 text-center">
                    <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No posts found matching your filters</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowAddModal(true)}
                      data-testid="button-add-first-post"
                    >
                      Create Your First Post
                    </Button>
                  </GlassCard>
                )}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              {/* Calendar Hero */}
              <div className="relative rounded-xl overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${crewMeasuring})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/95 to-[#1e3a5f]/70" />
                <div className="relative z-10 p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-white mb-2">Content Calendar</h2>
                  <p className="text-white/80 text-sm max-w-xl">
                    Plan and schedule your posts in advance. A consistent posting schedule builds trust with your audience.
                  </p>
                </div>
              </div>

              {/* Educational Tip */}
              <GlassCard className="p-4 border-l-4 border-l-[#1e3a5f]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Scheduling Best Practices</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Consistency wins:</strong> Posting 3-4 times per week is better than posting daily one week and nothing the next. 
                      <strong> Best times:</strong> Weekday mornings (7-9 AM) and evenings (5-7 PM) typically get the most engagement.
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="outline" size="sm" onClick={() => setCalendarWeekStart(addDays(calendarWeekStart, -7))} data-testid="button-prev-week">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="text-lg font-semibold">
                    Week of {format(calendarWeekStart, "MMMM d, yyyy")}
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setCalendarWeekStart(addDays(calendarWeekStart, 7))} data-testid="button-next-week">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, i) => (
                    <div key={i} className="min-h-[150px]">
                      <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
                        <p className="text-xs text-gray-500">{format(day.date, "EEE")}</p>
                        <p className="font-bold">{format(day.date, "d")}</p>
                      </div>
                      <div className="border border-t-0 rounded-b-lg p-2 space-y-1 min-h-[100px]">
                        {day.posts.map(post => {
                          const platform = PLATFORMS.find(p => p.id === post.platform);
                          return (
                            <div 
                              key={post.id}
                              className={`p-1 rounded text-xs bg-gradient-to-r ${platform?.color} text-white truncate cursor-pointer`}
                              title={post.content}
                              onClick={() => setEditingPost(post)}
                            >
                              {post.content.slice(0, 20)}...
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Quick Schedule
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select a post and date to add to the schedule
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {PLATFORMS.map(platform => {
                    const platformPosts = posts.filter(p => p.brand === selectedTenant && p.platform === platform.id);
                    const scheduled = platformPosts.filter(p => p.status === "scheduled").length;
                    const available = platformPosts.filter(p => p.status === "draft").length;
                    
                    return (
                      <Card key={platform.id}>
                        <CardHeader className={`bg-gradient-to-r ${platform.color} text-white rounded-t-lg py-3`}>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <platform.icon className="w-4 h-4" />
                            {platform.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>{scheduled} scheduled</span>
                            <span>{available} available</span>
                          </div>
                          <Select onValueChange={(postId) => {
                            const post = posts.find(p => p.id === postId);
                            if (post) schedulePost(post, new Date().toISOString());
                          }}>
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Schedule a post..." />
                            </SelectTrigger>
                            <SelectContent>
                              {posts
                                .filter(p => p.brand === selectedTenant && p.platform === platform.id && p.status === "draft")
                                .slice(0, 10)
                                .map(p => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.content.slice(0, 40)}...
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6" data-testid="analytics-tab-content">
              {/* Analytics Hero */}
              <div className="relative rounded-xl overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${commercialLobby})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/95 to-[#1e3a5f]/70" />
                <div className="relative z-10 p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-white mb-2">Analytics Center</h2>
                  <p className="text-white/80 text-sm max-w-xl">
                    Track your marketing performance with clear metrics. Each metric below includes an explanation of what it means and why it matters.
                  </p>
                </div>
              </div>

              {/* Understanding Your Metrics - Educational */}
              <GlassCard className="p-4 border-l-4 border-l-[#1e3a5f]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">How to Read Your Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      Analytics help you understand what's working and what needs attention. 
                      <strong> Evergreen content</strong> can be reused year-round (like "5 tips for choosing paint colors").
                      <strong> Seasonal content</strong> is timely (like "Spring painting specials"). 
                      A healthy mix is 70% evergreen, 30% seasonal.
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Key Metrics Grid with Explanations */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="p-4" data-testid="metric-total-content">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Total Content</p>
                    </div>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200">
                    <strong>What this means:</strong> The total number of posts, images, and messages in your library. More content gives you more options for posting.
                  </div>
                </GlassCard>

                <GlassCard className="p-4" data-testid="metric-published">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.posted}</p>
                      <p className="text-xs text-muted-foreground">Published</p>
                    </div>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-800 dark:text-green-200">
                    <strong>What this means:</strong> Content that has been posted to social media. Track this weekly to ensure consistent posting.
                  </div>
                </GlassCard>

                <GlassCard className="p-4" data-testid="metric-scheduled">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.scheduled}</p>
                      <p className="text-xs text-muted-foreground">Scheduled</p>
                    </div>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-800 dark:text-amber-200">
                    <strong>What this means:</strong> Posts ready to go live. Aim to always have 7+ days of content scheduled ahead.
                  </div>
                </GlassCard>

                <GlassCard className="p-4" data-testid="metric-evergreen-ratio">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{Math.round((stats.evergreen / Math.max(stats.total, 1)) * 100)}%</p>
                      <p className="text-xs text-muted-foreground">Evergreen Ratio</p>
                    </div>
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs text-purple-800 dark:text-purple-200">
                    <strong>What this means:</strong> Percentage of reusable content. Target 70%+ evergreen for consistent posting without always creating new content.
                  </div>
                </GlassCard>
              </div>

              {/* Detailed Analytics */}
              <BentoGrid className="gap-4">
                <BentoItem colSpan={3} mobileColSpan={6}>
                  <GlassCard className="p-4 h-full" data-testid="analytics-total-content">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Total Content</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
                      <Sparkles className="w-3 h-3" />
                      <span>{stats.evergreen} evergreen, {stats.seasonal} seasonal</span>
                    </div>
                  </GlassCard>
                </BentoItem>
                <BentoItem colSpan={3} mobileColSpan={6}>
                  <GlassCard className="p-4 h-full" data-testid="analytics-published">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.posted}</p>
                        <p className="text-xs text-muted-foreground">Published</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.posted / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {stats.total > 0 ? Math.round((stats.posted / stats.total) * 100) : 0}% publish rate
                    </p>
                  </GlassCard>
                </BentoItem>
                <BentoItem colSpan={3} mobileColSpan={6}>
                  <GlassCard className="p-4 h-full" data-testid="analytics-scheduled">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.scheduled}</p>
                        <p className="text-xs text-muted-foreground">Scheduled</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs text-amber-600">
                      <Calendar className="w-3 h-3" />
                      <span>Next 7 days pipeline</span>
                    </div>
                  </GlassCard>
                </BentoItem>
                <BentoItem colSpan={3} mobileColSpan={6}>
                  <GlassCard className="p-4 h-full" data-testid="analytics-evergreen-ratio">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{Math.round((stats.evergreen / Math.max(stats.total, 1)) * 100)}%</p>
                        <p className="text-xs text-muted-foreground">Evergreen Ratio</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Badge variant="outline" className="text-[10px]">{stats.evergreen} evergreen</Badge>
                      <Badge variant="outline" className="text-[10px]">{stats.seasonal} seasonal</Badge>
                    </div>
                  </GlassCard>
                </BentoItem>
              </BentoGrid>

              <div className="grid md:grid-cols-3 gap-6">
                <GlassCard className="p-6" data-testid="analytics-platform-performance">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Platform Performance
                  </h3>
                  <div className="space-y-4">
                    {PLATFORMS.map(platform => {
                      const platformPosts = posts.filter(p => p.brand === selectedTenant && p.platform === platform.id);
                      const posted = platformPosts.filter(p => p.status === "posted").length;
                      const total = platformPosts.length;
                      const percent = stats.total > 0 ? (total / stats.total) * 100 : 0;
                      return (
                        <div key={platform.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                                <platform.icon className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-medium">{platform.label}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{total}</p>
                              <p className="text-[10px] text-muted-foreground">{posted} posted</p>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                              className={`h-full bg-gradient-to-r ${platform.color} rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Multi-Platform Coverage</span>
                      <span className="font-bold text-green-600">
                        {PLATFORMS.filter(p => posts.some(post => post.brand === selectedTenant && post.platform === p.id)).length}/{PLATFORMS.length} active
                      </span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6" data-testid="analytics-category-distribution">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-blue-500" />
                    Category Distribution
                  </h3>
                  <div className="space-y-3">
                    {CATEGORIES.slice(0, 6).map((cat, idx) => {
                      const count = posts.filter(p => p.brand === selectedTenant && p.category === cat.id).length;
                      const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      const colors = [
                        "from-pink-500 to-rose-600",
                        "from-blue-500 to-cyan-600",
                        "from-green-500 to-emerald-600",
                        "from-amber-500 to-orange-600",
                        "from-purple-500 to-violet-600",
                        "from-indigo-500 to-blue-600",
                      ];
                      return (
                        <div key={cat.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1.5">
                              <cat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                              {cat.label}
                            </span>
                            <span className="font-medium">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className={`h-full bg-gradient-to-r ${colors[idx % colors.length]} rounded-full`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coverage Score</span>
                      <span className="font-bold text-blue-600">
                        {Math.round((CATEGORIES.filter(c => posts.some(p => p.brand === selectedTenant && p.category === c.id)).length / CATEGORIES.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6" data-testid="analytics-health-score">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-semibold">Portfolio Insights</h3>
                  </div>
                  {(() => {
                    const activeContent = stats.posted + stats.scheduled;
                    const conversionRate = activeContent > 0 ? Math.round((stats.posted / activeContent) * 100) : 0;
                    const evergreenRatio = stats.total > 0 ? Math.round((stats.evergreen / stats.total) * 100) : 0;
                    const coverageCategories = CATEGORIES.filter(c => posts.some(p => p.brand === selectedTenant && p.category === c.id)).length;
                    const coveragePercent = Math.round((coverageCategories / CATEGORIES.length) * 100);
                    
                    return (
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Completion Rate</span>
                            <span className={`text-lg font-bold ${conversionRate >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                              {conversionRate}%
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Published / (Scheduled + Published)</p>
                          <div className="h-1.5 mt-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${conversionRate}%` }} 
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center">
                            <p className="text-lg font-bold text-purple-600">{evergreenRatio}%</p>
                            <p className="text-[10px] text-muted-foreground">Evergreen</p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                            <p className="text-lg font-bold text-blue-600">{coveragePercent}%</p>
                            <p className="text-[10px] text-muted-foreground">Category Coverage</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t text-[10px] text-muted-foreground text-center">
                          Based on current content portfolio composition
                        </div>
                      </div>
                    );
                  })()}
                </GlassCard>
              </div>

              <GlassCard className="p-6" data-testid="analytics-activity-dashboard">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Activity Dashboard
                </h3>
                <BentoGrid className="gap-3">
                  <BentoItem colSpan={2} mobileColSpan={5}>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20 rounded-xl text-center h-full flex flex-col justify-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{posts.filter(p => p.brand === selectedTenant && p.claimedBy).length}</p>
                      <p className="text-xs text-muted-foreground">Claimed Posts</p>
                    </div>
                  </BentoItem>
                  <BentoItem colSpan={2} mobileColSpan={5}>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20 rounded-xl text-center h-full flex flex-col justify-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{stats.posted}</p>
                      <p className="text-xs text-muted-foreground">Published</p>
                    </div>
                  </BentoItem>
                  <BentoItem colSpan={2} mobileColSpan={5}>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/20 rounded-xl text-center h-full flex flex-col justify-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
                      <p className="text-xs text-muted-foreground">Scheduled</p>
                    </div>
                  </BentoItem>
                  <BentoItem colSpan={2} mobileColSpan={5}>
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/30 rounded-xl text-center h-full flex flex-col justify-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-600">{stats.drafts}</p>
                      <p className="text-xs text-muted-foreground">Drafts</p>
                    </div>
                  </BentoItem>
                  <BentoItem colSpan={2} mobileColSpan={10}>
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/20 rounded-xl text-center h-full flex flex-col justify-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {posts.filter(p => p.brand === selectedTenant && checkDuplicateUsage(p)).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Recently Used</p>
                    </div>
                  </BentoItem>
                </BentoGrid>
              </GlassCard>

              <GlassCard className="p-6" data-testid="analytics-weekly-trends">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  Weekly Posting Trends
                </h3>
                <div className="space-y-4">
                  {(() => {
                    const tenantPosts = posts.filter(p => p.brand === selectedTenant);
                    const now = new Date();
                    const TARGET_PER_WEEK = 9;
                    const BAR_HEIGHT = 80;
                    
                    const weeks = Array.from({ length: 6 }, (_, i) => {
                      const weekStart = new Date(now);
                      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
                      weekStart.setHours(0, 0, 0, 0);
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 7);
                      
                      const scheduledInWeek = tenantPosts.filter(p => {
                        if (!p.scheduledDate || p.status !== 'scheduled') return false;
                        const postDate = new Date(p.scheduledDate);
                        return postDate >= weekStart && postDate < weekEnd;
                      }).length;
                      
                      const postedInWeek = tenantPosts.filter(p => {
                        if (p.status !== 'posted' || !p.lastUsed) return false;
                        const postDate = new Date(p.lastUsed);
                        return postDate >= weekStart && postDate < weekEnd;
                      }).length;
                      
                      return {
                        label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i}w ago`,
                        scheduled: scheduledInWeek,
                        posted: postedInWeek,
                        total: scheduledInWeek + postedInWeek
                      };
                    }).reverse();
                    
                    const maxCount = Math.max(...weeks.map(w => w.total), TARGET_PER_WEEK);
                    const avgPerWeek = weeks.reduce((sum, w) => sum + w.total, 0) / weeks.length;
                    const onTarget = avgPerWeek >= TARGET_PER_WEEK;
                    
                    return (
                      <>
                        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                          <div>
                            <p className="text-sm font-medium">Weekly Cadence</p>
                            <p className="text-xs text-muted-foreground">6-week average vs target</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${onTarget ? 'text-green-600' : 'text-amber-600'}`}>
                              {avgPerWeek.toFixed(1)}
                            </p>
                            <p className="text-xs text-muted-foreground">/ {TARGET_PER_WEEK} target</p>
                          </div>
                        </div>
                        <div className="flex items-end gap-2" style={{ height: `${BAR_HEIGHT + 24}px` }}>
                          {weeks.map((week, idx) => {
                            const totalHeight = week.total > 0 ? (week.total / maxCount) * BAR_HEIGHT : 2;
                            const postedHeight = week.total > 0 ? (week.posted / week.total) * totalHeight : 0;
                            const scheduledHeight = totalHeight - postedHeight;
                            
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex flex-col items-center justify-end" style={{ height: `${BAR_HEIGHT}px` }}>
                                  <div className="w-full max-w-8 flex flex-col">
                                    {week.posted > 0 && (
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${postedHeight}px` }}
                                        transition={{ duration: 0.4, delay: idx * 0.06 }}
                                        className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-sm"
                                      />
                                    )}
                                    {week.scheduled > 0 && (
                                      <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${scheduledHeight}px` }}
                                        transition={{ duration: 0.4, delay: idx * 0.06 + 0.05 }}
                                        className={`w-full bg-gradient-to-t from-indigo-500 to-violet-400 ${week.posted === 0 ? 'rounded-t-sm' : ''}`}
                                      />
                                    )}
                                    {week.total === 0 && (
                                      <div className="w-full h-0.5 bg-gray-300 dark:bg-gray-600 rounded" />
                                    )}
                                  </div>
                                </div>
                                <span className="text-[9px] text-muted-foreground text-center">{week.label}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-center gap-4 pt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded bg-gradient-to-r from-green-500 to-emerald-400" />
                            <span>Published</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded bg-gradient-to-r from-indigo-500 to-violet-400" />
                            <span>Scheduled</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </GlassCard>

              {/* Recharts Visualizations */}
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="p-6" data-testid="analytics-posting-trend-chart">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Posting Activity (Last 14 Days)
                  </h3>
                  {(() => {
                    const tenantPosts = posts.filter(p => p.brand === selectedTenant);
                    const today = new Date();
                    const trendData = eachDayOfInterval({
                      start: subDays(today, 13),
                      end: today
                    }).map(day => {
                      const posted = tenantPosts.filter(p => 
                        p.status === "posted" && p.lastUsed && isSameDay(new Date(p.lastUsed), day)
                      ).length;
                      const scheduled = tenantPosts.filter(p => 
                        p.status === "scheduled" && p.scheduledDate && isSameDay(new Date(p.scheduledDate), day)
                      ).length;
                      return {
                        date: format(day, 'MM/dd'),
                        Posted: posted,
                        Scheduled: scheduled,
                        total: posted + scheduled
                      };
                    });
                    return (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,136,136,0.2)" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="rgba(136,136,136,0.5)" />
                          <YAxis tick={{ fontSize: 10 }} stroke="rgba(136,136,136,0.5)" allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.8)', 
                              border: 'none', 
                              borderRadius: '8px',
                              fontSize: '12px'
                            }} 
                          />
                          <Line type="monotone" dataKey="Posted" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                          <Line type="monotone" dataKey="Scheduled" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </GlassCard>

                <GlassCard className="p-6" data-testid="analytics-category-bar-chart">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Content by Category
                  </h3>
                  {(() => {
                    const tenantPosts = posts.filter(p => p.brand === selectedTenant);
                    const categoryData = CATEGORIES.map(cat => ({
                      name: cat.label.length > 8 ? cat.label.slice(0, 8) + '...' : cat.label,
                      count: tenantPosts.filter(p => p.category === cat.id).length
                    })).filter(d => d.count > 0);
                    
                    const COLORS = ['#ec4899', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'];
                    
                    return (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={categoryData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(136,136,136,0.2)" />
                          <XAxis type="number" tick={{ fontSize: 10 }} stroke="rgba(136,136,136,0.5)" allowDecimals={false} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="rgba(136,136,136,0.5)" width={70} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(0,0,0,0.8)', 
                              border: 'none', 
                              borderRadius: '8px',
                              fontSize: '12px'
                            }} 
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </GlassCard>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="p-6" data-testid="analytics-top-content">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Top Performing Content
                  </h3>
                  <div className="space-y-3">
                    {posts
                      .filter(p => p.brand === selectedTenant && p.status === "posted")
                      .slice(0, 5)
                      .map((post, idx) => (
                        <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">{post.platform}</Badge>
                              <Badge variant="outline" className="text-[10px]">{post.category}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    {posts.filter(p => p.brand === selectedTenant && p.status === "posted").length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No published content yet</p>
                      </div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Posting Schedule Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Weekly Target</span>
                        <span className="text-lg font-bold text-blue-600">9 posts</span>
                      </div>
                      <p className="text-xs text-muted-foreground">3 posts per platform recommended</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Current Pipeline</span>
                        <span className="text-lg font-bold text-green-600">{stats.scheduled} ready</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Scheduled for upcoming weeks</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Content Velocity</span>
                        <span className="text-lg font-bold text-purple-600">
                          {Math.round((stats.posted + stats.scheduled) / 4)}/week
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Average posting frequency</p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Seasonal Balance</span>
                        <span className="text-lg font-bold text-amber-600">
                          {Math.round((stats.seasonal / Math.max(stats.total, 1)) * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Timely promotional content</p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Google Analytics Integration Section */}
              <GlassCard className="p-6 border-2 border-dashed border-blue-300 dark:border-blue-700" data-testid="analytics-ga-integration">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Google Analytics Integration
                  </h3>
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-blue-300">
                    Coming Soon
                  </Badge>
                </div>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">--</p>
                    <p className="text-xs text-muted-foreground">Live Visitors</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">--</p>
                    <p className="text-xs text-muted-foreground">Page Views (7d)</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">--</p>
                    <p className="text-xs text-muted-foreground">Avg Session</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-600">--</p>
                    <p className="text-xs text-muted-foreground">Bounce Rate</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Traffic Trend (30 Days)
                    </h4>
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Connect GA4 to see traffic data</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Top Referrers
                    </h4>
                    <div className="space-y-2">
                      {["Google Search", "Facebook", "Instagram", "Direct", "Nextdoor"].map((source, idx) => (
                        <div key={source} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{source}</span>
                          <span className="font-mono text-muted-foreground">--</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>GA4 Integration:</strong> Once connected, you'll see real-time website traffic, 
                    top pages, referral sources, device breakdown, and conversion tracking all synced with your 
                    social media performance data.
                  </p>
                </div>
              </GlassCard>

              {/* Platform Distribution Pie Chart */}
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="p-6" data-testid="analytics-platform-pie">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-pink-500" />
                    Content Distribution by Platform
                  </h3>
                  {(() => {
                    const tenantPosts = posts.filter(p => p.brand === selectedTenant);
                    const platformData = PLATFORMS.map(platform => ({
                      name: platform.label,
                      value: tenantPosts.filter(p => p.platform === platform.id).length,
                      color: platform.id === "instagram" ? "#E1306C" : platform.id === "facebook" ? "#4267B2" : "#00B636"
                    })).filter(d => d.value > 0);
                    
                    if (platformData.length === 0) {
                      return (
                        <div className="h-48 flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No content data yet</p>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={platformData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {platformData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(0,0,0,0.8)', 
                                border: 'none', 
                                borderRadius: '8px',
                                fontSize: '12px'
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-2">
                          {platformData.map(platform => (
                            <div key={platform.name} className="flex items-center gap-1.5 text-xs">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                              <span>{platform.name}</span>
                              <span className="font-bold">({platform.value})</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </GlassCard>

                <GlassCard className="p-6" data-testid="analytics-content-health">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-500" />
                    Content Health Score
                  </h3>
                  {(() => {
                    const tenantPosts = posts.filter(p => p.brand === selectedTenant);
                    const total = tenantPosts.length;
                    const posted = tenantPosts.filter(p => p.status === "posted").length;
                    const scheduled = tenantPosts.filter(p => p.status === "scheduled").length;
                    const evergreen = tenantPosts.filter(p => p.type === "evergreen").length;
                    const categoryCount = new Set(tenantPosts.map(p => p.category)).size;
                    const platformCount = new Set(tenantPosts.map(p => p.platform)).size;
                    
                    // Calculate health score (0-100)
                    const diversityScore = Math.min(categoryCount * 12, 30); // Max 30 points
                    const coverageScore = Math.min(platformCount * 10, 30); // Max 30 points
                    const evergreenScore = total > 0 ? Math.round((evergreen / total) * 20) : 0; // Max 20 points
                    const activityScore = Math.min((posted + scheduled) * 2, 20); // Max 20 points
                    const healthScore = diversityScore + coverageScore + evergreenScore + activityScore;
                    
                    const scoreColor = healthScore >= 80 ? "text-green-600" : healthScore >= 60 ? "text-blue-600" : healthScore >= 40 ? "text-amber-600" : "text-red-600";
                    const bgColor = healthScore >= 80 ? "from-green-500 to-emerald-400" : healthScore >= 60 ? "from-blue-500 to-cyan-400" : healthScore >= 40 ? "from-amber-500 to-orange-400" : "from-red-500 to-rose-400";
                    
                    return (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="relative inline-flex items-center justify-center">
                            <svg className="w-32 h-32 transform -rotate-90">
                              <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                              <circle 
                                cx="64" cy="64" r="56" fill="none" strokeWidth="8" 
                                strokeLinecap="round"
                                className={`text-transparent bg-gradient-to-r ${bgColor}`}
                                style={{ 
                                  stroke: healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#3b82f6' : healthScore >= 40 ? '#f59e0b' : '#ef4444',
                                  strokeDasharray: `${healthScore * 3.52} 352` 
                                }}
                              />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className={`text-3xl font-bold ${scoreColor}`}>{healthScore}</span>
                              <span className="text-xs text-muted-foreground">/ 100</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="font-medium">Diversity</p>
                            <p className="text-muted-foreground">{diversityScore}/30 pts</p>
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="font-medium">Coverage</p>
                            <p className="text-muted-foreground">{coverageScore}/30 pts</p>
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="font-medium">Evergreen</p>
                            <p className="text-muted-foreground">{evergreenScore}/20 pts</p>
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <p className="font-medium">Activity</p>
                            <p className="text-muted-foreground">{activityScore}/20 pts</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </GlassCard>
              </div>

              {/* Best Posting Times */}
              <GlassCard className="p-6" data-testid="analytics-best-times">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Recommended Posting Times
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {PLATFORMS.map(platform => (
                    <div key={platform.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                          <platform.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">{platform.label}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Best Day</span>
                          <span className="font-medium">{platform.id === "instagram" ? "Wed, Fri" : platform.id === "facebook" ? "Thu, Sun" : "Sat"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Best Time</span>
                          <span className="font-medium">{platform.id === "instagram" ? "11am, 7pm" : platform.id === "facebook" ? "1pm, 8pm" : "10am"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frequency</span>
                          <span className="font-medium text-green-600">3x/week</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    These recommendations are based on industry best practices for painting/home services. 
                    Once GA4 is connected, we'll optimize these based on your actual audience engagement data.
                  </p>
                </div>
              </GlassCard>

              {/* WEBSITE ANALYTICS - Real Traffic Data */}
              <GlassCard className="p-6" data-testid="analytics-website-traffic">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedTenant === "npp" ? "from-blue-500 to-indigo-600" : "from-purple-500 to-violet-600"} flex items-center justify-center`}>
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Website Traffic</h3>
                      <p className={`text-sm font-medium ${selectedTenant === "npp" ? "text-blue-600" : "text-purple-600"}`}>
                        {selectedTenant === "npp" ? "Nashville Painting Professionals" : "Paint Pros Co"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${selectedTenant === "npp" 
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 border-blue-200" 
                        : "bg-purple-50 dark:bg-purple-900/30 text-purple-600 border-purple-200"}`}
                    >
                      {selectedTenant === "npp" ? "NPP" : "LUME"}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchAnalytics()}
                      data-testid="button-refresh-analytics"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                      </div>
                    ))}
                  </div>
                ) : websiteAnalytics ? (
                  <div className="space-y-6">
                    {/* Traffic Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20 rounded-xl">
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                          <Zap className="w-4 h-4 animate-pulse" />
                          <span className="text-xs font-medium">Live Now</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{websiteAnalytics.liveVisitors}</p>
                        <p className="text-[10px] text-muted-foreground">Active visitors</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-medium">Today</span>
                        </div>
                        <p className="text-2xl font-bold">{websiteAnalytics.today.views}</p>
                        <p className="text-[10px] text-muted-foreground">{websiteAnalytics.today.visitors} visitors</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20 rounded-xl">
                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-medium">This Week</span>
                        </div>
                        <p className="text-2xl font-bold">{websiteAnalytics.thisWeek.views}</p>
                        <p className="text-[10px] text-muted-foreground">{websiteAnalytics.thisWeek.visitors} visitors</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 rounded-xl">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-medium">This Month</span>
                        </div>
                        <p className="text-2xl font-bold">{websiteAnalytics.thisMonth.views}</p>
                        <p className="text-[10px] text-muted-foreground">{websiteAnalytics.thisMonth.visitors} visitors</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/30 rounded-xl">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs font-medium">All Time</span>
                        </div>
                        <p className="text-2xl font-bold">{websiteAnalytics.allTime.views.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{websiteAnalytics.allTime.visitors.toLocaleString()} visitors</p>
                      </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Daily Traffic Chart */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          Daily Traffic (14 days)
                        </h4>
                        <ResponsiveContainer width="100%" height={150}>
                          <AreaChart data={websiteAnalytics.dailyTraffic}>
                            <defs>
                              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="rgba(136,136,136,0.5)" />
                            <YAxis tick={{ fontSize: 9 }} stroke="rgba(136,136,136,0.5)" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '11px' }} />
                            <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fill="url(#colorViews)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Device Breakdown */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-purple-500" />
                          Device Breakdown
                        </h4>
                        <div className="flex items-center gap-4">
                          <ResponsiveContainer width={100} height={100}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Desktop', value: websiteAnalytics.deviceBreakdown.desktop, color: '#f59e0b' },
                                  { name: 'Mobile', value: websiteAnalytics.deviceBreakdown.mobile, color: '#3b82f6' },
                                  { name: 'Tablet', value: websiteAnalytics.deviceBreakdown.tablet, color: '#10b981' },
                                ].filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={40}
                                dataKey="value"
                              >
                                {[
                                  { name: 'Desktop', value: websiteAnalytics.deviceBreakdown.desktop, color: '#f59e0b' },
                                  { name: 'Mobile', value: websiteAnalytics.deviceBreakdown.mobile, color: '#3b82f6' },
                                  { name: 'Tablet', value: websiteAnalytics.deviceBreakdown.tablet, color: '#10b981' },
                                ].filter(d => d.value > 0).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-amber-500" />
                                <span>Desktop</span>
                              </div>
                              <span className="font-medium">{websiteAnalytics.deviceBreakdown.desktop}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-blue-500" />
                                <span>Mobile</span>
                              </div>
                              <span className="font-medium">{websiteAnalytics.deviceBreakdown.mobile}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Tablet className="w-4 h-4 text-green-500" />
                                <span>Tablet</span>
                              </div>
                              <span className="font-medium">{websiteAnalytics.deviceBreakdown.tablet}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Pages & Referrers */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-500" />
                          Top Pages
                        </h4>
                        <div className="space-y-2">
                          {websiteAnalytics.topPages.slice(0, 5).map((page, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="truncate flex-1 text-muted-foreground">{page.page}</span>
                              <span className="font-medium ml-2">{page.views}</span>
                            </div>
                          ))}
                          {websiteAnalytics.topPages.length === 0 && (
                            <p className="text-sm text-muted-foreground">No page data yet</p>
                          )}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-teal-500" />
                          Top Referrers
                        </h4>
                        <div className="space-y-2">
                          {websiteAnalytics.topReferrers.slice(0, 5).map((ref, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="truncate flex-1 text-muted-foreground">{ref.referrer || 'Direct'}</span>
                              <span className="font-medium ml-2">{ref.count}</span>
                            </div>
                          ))}
                          {websiteAnalytics.topReferrers.length === 0 && (
                            <p className="text-sm text-muted-foreground">No referrer data yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${selectedTenant === "npp" ? "from-blue-500/20 to-indigo-600/20" : "from-purple-500/20 to-violet-600/20"} flex items-center justify-center`}>
                      <Globe className={`w-8 h-8 ${selectedTenant === "npp" ? "text-blue-500" : "text-purple-500"}`} />
                    </div>
                    <p className="font-medium mb-1">
                      {selectedTenant === "npp" ? "Nashville Painting Professionals" : "Paint Pros Co"}
                    </p>
                    <p className="text-sm text-muted-foreground">Website analytics will appear here once traffic is tracked</p>
                  </div>
                )}
              </GlassCard>
            </TabsContent>

            {/* NOTES TAB - Team communication notepad */}
            <TabsContent value="notes" className="space-y-6" data-testid="notes-tab-content">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-500" />
                    Team Notes
                  </h3>
                  <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 text-purple-600">
                    {teamNotes.filter(n => n.tenant === selectedTenant).length} notes
                  </Badge>
                </div>
                
                {/* Add New Note */}
                <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                  <Label className="text-sm font-medium mb-2 block">Leave a note for the team</Label>
                  <Textarea
                    placeholder="What's happening? Updates, reminders, ideas..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[100px] mb-3"
                    data-testid="input-new-note"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Posting as <span className="font-medium">{userName}</span> ({userRole === "marketing" ? "Marketing Manager" : userRole === "developer" ? "Marketing Director" : userRole === "owner" ? "Owner" : "Admin"})
                    </p>
                    <Button 
                      onClick={() => {
                        if (!newNoteContent.trim()) return;
                        const newNote: TeamNote = {
                          id: `note-${Date.now()}`,
                          author: userName,
                          role: userRole === "marketing" ? "Marketing Manager" : userRole === "developer" ? "Marketing Director" : userRole === "owner" ? "Owner" : "Admin",
                          content: newNoteContent.trim(),
                          createdAt: new Date().toISOString(),
                          tenant: selectedTenant
                        };
                        const updated = [newNote, ...teamNotes];
                        setTeamNotes(updated);
                        localStorage.setItem("marketing_team_notes", JSON.stringify(updated));
                        setNewNoteContent("");
                      }}
                      disabled={!newNoteContent.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                      data-testid="button-add-note"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Post Note
                    </Button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                  {teamNotes
                    .filter(note => note.tenant === selectedTenant)
                    .map(note => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                              {note.author.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{note.author}</p>
                              <p className="text-xs text-muted-foreground">{note.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.createdAt), "MMM d, h:mm a")}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                const updated = teamNotes.filter(n => n.id !== note.id);
                                setTeamNotes(updated);
                                localStorage.setItem("marketing_team_notes", JSON.stringify(updated));
                              }}
                              data-testid={`button-delete-note-${note.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </motion.div>
                    ))}
                  
                  {teamNotes.filter(n => n.tenant === selectedTenant).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium">No notes yet</p>
                      <p className="text-sm">Leave a note for your team above</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </TabsContent>

            {/* CAMPAIGNS TAB - ROI Tracking */}
            <TabsContent value="campaigns" className="space-y-6" data-testid="campaigns-tab-content">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-500" />
                    Campaign ROI Tracker
                  </h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Ready for API Integration
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">
                  Track marketing spend, lead attribution, and ROI. Once Meta/Google APIs are connected, costs will sync automatically.
                </p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Spend</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">$0.00</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">This month</p>
                  </div>
                  <div className="p-4 rounded-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">Leads Generated</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">0</p>
                    <p className="text-xs text-green-600 dark:text-green-400">From campaigns</p>
                  </div>
                  <div className="p-4 rounded-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Cost Per Lead</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">$0.00</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Average</p>
                  </div>
                </div>

                <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6 text-center">
                  <Target className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Create Your First Campaign</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track Facebook ads, Google campaigns, mailers, and more. See which marketing efforts bring the best ROI.
                  </p>
                  <Button variant="outline" data-testid="button-create-campaign">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Campaign
                  </Button>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-blue-500" />
                  Attribution Sources
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Facebook className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Facebook/Instagram Ads</p>
                        <p className="text-xs text-muted-foreground">Via Meta Business Suite API</p>
                      </div>
                      <Badge className="ml-auto bg-yellow-100 text-yellow-700">Pending</Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Google Ads</p>
                        <p className="text-xs text-muted-foreground">Via Google Ads API</p>
                      </div>
                      <Badge className="ml-auto bg-yellow-100 text-yellow-700">Pending</Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Google LSA</p>
                        <p className="text-xs text-muted-foreground">Local Services Ads</p>
                      </div>
                      <Badge className="ml-auto bg-green-100 text-green-700">Connected</Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Manual Entry</p>
                        <p className="text-xs text-muted-foreground">Mailers, flyers, events</p>
                      </div>
                      <Badge className="ml-auto bg-green-100 text-green-700">Ready</Badge>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>

            {/* AI TOOLS TAB - Copy Generator */}
            <TabsContent value="ai-tools" className="space-y-6" data-testid="ai-tools-tab-content">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-500" />
                    Copy Generator
                  </h3>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Powered by OpenAI
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Generate social media posts, ad copy, and email content using your brand voice. No more writer's block.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Content Type</Label>
                      <Select defaultValue="social">
                        <SelectTrigger className="mt-1" data-testid="select-content-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="social">Social Media Post</SelectItem>
                          <SelectItem value="ad">Ad Copy</SelectItem>
                          <SelectItem value="email">Email Subject Line</SelectItem>
                          <SelectItem value="sms">SMS Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Service Focus</Label>
                      <Select defaultValue="interior">
                        <SelectTrigger className="mt-1" data-testid="select-service-focus">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interior">Interior Painting</SelectItem>
                          <SelectItem value="exterior">Exterior Painting</SelectItem>
                          <SelectItem value="cabinets">Cabinet Refinishing</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="general">General/Brand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tone</Label>
                      <Select defaultValue="professional">
                        <SelectTrigger className="mt-1" data-testid="select-tone">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly & Warm</SelectItem>
                          <SelectItem value="urgent">Urgent/Limited Time</SelectItem>
                          <SelectItem value="educational">Educational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" data-testid="button-generate-copy">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Copy
                    </Button>
                  </div>

                  <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <Label className="text-sm font-medium mb-2 block">Generated Copy</Label>
                    <div className="min-h-[200px] p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-muted-foreground">
                      <p className="italic">Your generated content will appear here...</p>
                      <p className="mt-4 text-xs">Select your options and click Generate to create brand-aligned copy.</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" disabled data-testid="button-copy-to-clipboard">
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" disabled data-testid="button-add-to-catalog">
                        <Plus className="w-3 h-3 mr-1" />
                        Add to Catalog
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <div className="grid md:grid-cols-3 gap-4">
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Facebook Post</p>
                      <p className="text-xs text-muted-foreground">Engagement-focused</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-quick-facebook">
                    Quick Generate
                  </Button>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Instagram Caption</p>
                      <p className="text-xs text-muted-foreground">With hashtags</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-quick-instagram">
                    Quick Generate
                  </Button>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Follow-up SMS</p>
                      <p className="text-xs text-muted-foreground">Lead nurturing</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" data-testid="button-quick-sms">
                    Quick Generate
                  </Button>
                </GlassCard>
              </div>
            </TabsContent>

            {/* PLAYBOOK TAB - Marketing Psychology */}
            <TabsContent value="playbook" className="space-y-6" data-testid="playbook-tab-content">
              {/* Playbook Hero */}
              <div className="relative rounded-xl overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${colorConsult})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/95 to-[#1e3a5f]/70" />
                <div className="relative z-10 p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-white mb-2">Marketing Playbook</h2>
                  <p className="text-white/80 text-sm max-w-xl">
                    Proven psychological principles and strategies that drive customer action. Learn what works and why.
                  </p>
                </div>
              </div>

              {/* Educational Intro */}
              <GlassCard className="p-4 border-l-4 border-l-[#1e3a5f]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-[#1e3a5f]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">How to Use the Playbook</h4>
                    <p className="text-sm text-muted-foreground">
                      Each strategy below is based on proven marketing psychology. Click to expand and see specific tactics you can use in your social media posts, ads, and customer communications.
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#1e3a5f]" />
                    Psychology Strategies
                  </h3>
                  <Badge variant="outline" className="bg-[#1e3a5f]/10 text-[#1e3a5f] border-[#1e3a5f]/30">
                    6 Proven Tactics
                  </Badge>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                  <AccordionItem value="social-proof" className="border rounded-md px-4 bg-blue-50/50 dark:bg-blue-900/10">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Social Proof</p>
                          <p className="text-xs text-muted-foreground">People trust what others trust</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="pl-11 space-y-3">
                        <p className="text-sm"><strong>Why it works:</strong> Customers look to others' experiences to validate their decisions.</p>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <p className="text-xs font-medium text-blue-600 mb-1">Tactics to use:</p>
                          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                            <li>Showcase 5-star reviews prominently</li>
                            <li>Display "500+ homes painted in Nashville"</li>
                            <li>Before/after photos with homeowner testimonials</li>
                            <li>Google review count badges on website</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="scarcity" className="border rounded-md px-4 bg-red-50/50 dark:bg-red-900/10">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-red-500 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Scarcity & Urgency</p>
                          <p className="text-xs text-muted-foreground">Limited availability drives action</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="pl-11 space-y-3">
                        <p className="text-sm"><strong>Why it works:</strong> Fear of missing out (FOMO) motivates quick decisions.</p>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <p className="text-xs font-medium text-red-600 mb-1">Tactics to use:</p>
                          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                            <li>"Only 3 spring slots remaining"</li>
                            <li>"Book by Friday for 10% off"</li>
                            <li>Seasonal campaigns with clear end dates</li>
                            <li>"Schedule now - crews booking 4 weeks out"</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="reciprocity" className="border rounded-md px-4 bg-green-50/50 dark:bg-green-900/10">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-green-500 flex items-center justify-center">
                          <Star className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Reciprocity</p>
                          <p className="text-xs text-muted-foreground">Give value first, receive trust back</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="pl-11 space-y-3">
                        <p className="text-sm"><strong>Why it works:</strong> When you give something free, people feel obligated to reciprocate.</p>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <p className="text-xs font-medium text-green-600 mb-1">Tactics to use:</p>
                          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                            <li>Free color consultations</li>
                            <li>Free detailed estimates (not just quotes)</li>
                            <li>Helpful blog content and paint tips</li>
                            <li>"Free touch-up kit with every project"</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="emotion" className="border rounded-md px-4 bg-purple-50/50 dark:bg-purple-900/10">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-purple-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Emotional Storytelling</p>
                          <p className="text-xs text-muted-foreground">Feelings drive decisions, logic justifies</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="pl-11 space-y-3">
                        <p className="text-sm"><strong>Why it works:</strong> People remember stories 22x more than facts. Emotions create lasting connections.</p>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <p className="text-xs font-medium text-purple-600 mb-1">Tactics to use:</p>
                          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                            <li>Tell homeowner transformation stories</li>
                            <li>Focus on how they'll FEEL in the space</li>
                            <li>"Elevating the backdrop of your life"</li>
                            <li>Show the journey: stressed → excited → proud</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="authority" className="border rounded-md px-4 bg-orange-50/50 dark:bg-orange-900/10">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-orange-500 flex items-center justify-center">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Authority & Expertise</p>
                          <p className="text-xs text-muted-foreground">Credentials build instant trust</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="pl-11 space-y-3">
                        <p className="text-sm"><strong>Why it works:</strong> People trust experts. Credentials reduce perceived risk.</p>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <p className="text-xs font-medium text-orange-600 mb-1">Tactics to use:</p>
                          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                            <li>Display licenses and insurance prominently</li>
                            <li>"10+ years serving Middle Tennessee"</li>
                            <li>Sherwin-Williams certified contractor</li>
                            <li>BBB accreditation and awards</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="loss-aversion" className="border rounded-md px-4 bg-yellow-50/50 dark:bg-yellow-900/10">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-yellow-500 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Loss Aversion</p>
                          <p className="text-xs text-muted-foreground">Avoiding loss beats gaining benefits</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="pl-11 space-y-3">
                        <p className="text-sm"><strong>Why it works:</strong> People feel losses 2x more intensely than equivalent gains.</p>
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <p className="text-xs font-medium text-yellow-600 mb-1">Tactics to use:</p>
                          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                            <li>"Don't let peeling paint decrease your home value"</li>
                            <li>"Stop losing curb appeal every year you wait"</li>
                            <li>"Protect your investment before winter damage"</li>
                            <li>3-year warranty = protection against future costs</li>
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Quick Action Checklist
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    "Use social proof (reviews, testimonials)",
                    "Create urgency with limited-time offers",
                    "Offer free consultations (reciprocity)",
                    "Tell transformation stories",
                    "Display credentials prominently",
                    "Frame benefits as avoiding losses",
                    "Add \"because\" to CTAs for persuasion",
                    "Use emotional imagery in posts"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </TabsContent>

            {/* BUDGET TAB - Marketing Spend Tracker */}
            <TabsContent value="budget" className="space-y-6" data-testid="budget-tab-content">
              {/* Budget Hero */}
              <div className="relative rounded-xl overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${commercialLobby})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f]/95 via-[#1e3a5f]/80 to-transparent" />
                <div className="relative z-10 p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white">Marketing ROI Tracker</h2>
                      <p className="text-white/80">Track spending, measure results, prove what works</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* META ADS SPEND - Live Data */}
              <MetaAdSpendSection tenantId={selectedTenant} />

              {/* META BILLING THRESHOLD TIP */}
              <GlassCard className="p-4 border-l-4 border-l-blue-500 bg-blue-500/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Reduce Email Receipts from Meta</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Getting charged every $2? Increase your billing threshold to get fewer charges and emails.
                    </p>
                    <div className="text-sm space-y-1">
                      <p><strong>How:</strong> Meta Ads Manager &rarr; Billing & Payments &rarr; Payment Settings &rarr; Click 3-dot menu next to threshold &rarr; Select $50 or $100</p>
                      <p className="text-muted-foreground text-xs mt-2">This controls when Meta bills your card. Higher threshold = fewer charges, same total spend.</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* CURRENT STATUS - The Reality */}
              <GlassCard className="p-6 border-l-4 border-amber-500 bg-amber-500/5">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Current Status: Starting From Zero
                </h3>
                <div className="space-y-3 text-sm">
                  <p className="font-medium">No historical ROI data exists. We cannot show what's working because nothing has been tracked.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="p-3 rounded-lg bg-background/50 border border-amber-500/20">
                      <p className="font-medium text-amber-600 mb-1">What We Don't Have:</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-500" /> Historical lead source data</li>
                        <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-500" /> Past marketing spend records</li>
                        <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-500" /> Cost-per-lead by channel</li>
                        <li className="flex items-center gap-2"><X className="w-3 h-3 text-red-500" /> ROI comparison data</li>
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-green-500/20">
                      <p className="font-medium text-green-600 mb-1">What We're Building:</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Expense tracking by category</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Lead source attribution</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> ROI calculator</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Monthly reporting</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* INDUSTRY BENCHMARKS */}
              <GlassCard className="p-6 border-l-4 border-[#1e3a5f]">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#1e3a5f]" />
                  Industry Benchmarks: Middle Tennessee Painting Companies
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These are average numbers for painting companies in our market. Once we start tracking, we can compare our actual results to these benchmarks.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/20">
                    <p className="text-2xl font-bold text-[#1e3a5f]">$85</p>
                    <p className="text-xs text-muted-foreground">Avg Cost Per Lead</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/20">
                    <p className="text-2xl font-bold text-[#1e3a5f]">42:1</p>
                    <p className="text-xs text-muted-foreground">Email Marketing ROI</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/20">
                    <p className="text-2xl font-bold text-[#1e3a5f]">4:1</p>
                    <p className="text-xs text-muted-foreground">Google Ads ROI</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/20">
                    <p className="text-2xl font-bold text-[#1e3a5f]">3-5%</p>
                    <p className="text-xs text-muted-foreground">Website Conversion Rate</p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/30 text-sm">
                  <p className="font-medium mb-2">What These Numbers Mean:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li><strong>Cost Per Lead:</strong> On average, painting companies spend $85 in marketing to get one potential customer to reach out.</li>
                    <li><strong>ROI (Return on Investment):</strong> A 4:1 ROI means for every $1 spent, you get $4 back in revenue.</li>
                    <li><strong>Conversion Rate:</strong> Of every 100 website visitors, 3-5 will request an estimate.</li>
                  </ul>
                </div>
              </GlassCard>

              {/* WHAT'S REQUIRED - The Deal */}
              <GlassCard className="p-6 border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  What's Required: Everyone Participates
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Marketing ROI tracking only works when everyone does their part. Here's the breakdown:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Owner/Management Provides:
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Budget Access:</strong> Clear monthly budget ($2,000) and ability to spend it</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Social Media Access:</strong> Full admin access to all business social accounts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Payment Method:</strong> Card or payment access to run paid campaigns</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Expense Reporting:</strong> Report any marketing spend made outside this system</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" /> Marketing Implements:
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Strategy:</strong> Research channels, recommend budget allocation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Content:</strong> Create posts, ads, and campaigns</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Tracking:</strong> Log all expenses, monitor lead sources</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span><strong>Reporting:</strong> Monthly ROI reports showing what's working</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-[#1e3a5f]/10 border border-[#1e3a5f]/30">
                  <p className="text-sm text-[#1e3a5f] flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>This tracking system is ready to use. Once everyone is logging expenses and leads, we'll have real ROI data to optimize our marketing spend.</span>
                  </p>
                </div>
              </GlassCard>

              {/* TIMELINE EXPECTATIONS */}
              <GlassCard className="p-6 border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  Timeline: What to Expect
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <p className="text-sm font-semibold text-purple-600 mb-2">Month 1: Setup</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>Gain access to all platforms</li>
                      <li>Inventory current spending</li>
                      <li>Start tracking lead sources</li>
                      <li>Establish baseline metrics</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <p className="text-sm font-semibold text-purple-600 mb-2">Months 2-3: Build Data</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>Run initial campaigns</li>
                      <li>Collect lead source data</li>
                      <li>Track cost per lead by channel</li>
                      <li>Adjust based on early results</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <p className="text-sm font-semibold text-purple-600 mb-2">Months 4+: Optimize</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>Shift budget to what works</li>
                      <li>Cut channels that underperform</li>
                      <li>Compare to industry benchmarks</li>
                      <li>Show real ROI numbers</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 italic">
                  Marketing results build over time. We cannot show ROI without first collecting the data. The sooner tracking starts, the sooner we can prove what works.
                </p>
              </GlassCard>

              {/* HOW TO USE THIS SYSTEM */}
              <GlassCard className="p-6 border-l-4 border-[#1e3a5f]">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#1e3a5f]" />
                  How This Tracking System Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div className="p-4 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center mx-auto mb-3 font-bold">1</div>
                    <h4 className="font-medium text-sm">Set Budget</h4>
                    <p className="text-xs text-muted-foreground mt-1">Define monthly marketing budget ($2,000)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center mx-auto mb-3 font-bold">2</div>
                    <h4 className="font-medium text-sm">Log Expenses</h4>
                    <p className="text-xs text-muted-foreground mt-1">Record every spend with category and amount</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center mx-auto mb-3 font-bold">3</div>
                    <h4 className="font-medium text-sm">Track Leads</h4>
                    <p className="text-xs text-muted-foreground mt-1">Customers tell us how they found us</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 text-center">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center mx-auto mb-3 font-bold">4</div>
                    <h4 className="font-medium text-sm">See ROI</h4>
                    <p className="text-xs text-muted-foreground mt-1">Calculator shows cost-per-lead by channel</p>
                  </div>
                </div>
              </GlassCard>

              {/* Monthly Budget Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Monthly Budget</span>
                    <Wallet className="w-4 h-4 text-[#1e3a5f]" />
                  </div>
                  <p className="text-2xl font-bold">$2,000</p>
                  <p className="text-xs text-muted-foreground mt-1">Set your target</p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Spent This Month</span>
                    <Receipt className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold">$850</p>
                  <p className="text-xs text-green-600 mt-1">42.5% of budget used</p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Leads This Month</span>
                    <Users className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-xs text-muted-foreground mt-1">From all channels</p>
                </GlassCard>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Cost Per Lead</span>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">$36.96</p>
                  <p className="text-xs text-muted-foreground mt-1">$850 ÷ 23 leads</p>
                </GlassCard>
              </div>

              {/* Expense Categories */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Spending by Category</h3>
                  <Button size="sm" className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90" data-testid="button-add-expense">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Expense
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Breakdown */}
                  <div className="space-y-3">
                    {[
                      { category: "Billboard", amount: 400, leads: 3, iconType: "billboard" },
                      { category: "Facebook Ads", amount: 200, leads: 12, iconType: "facebook" },
                      { category: "Google Ads", amount: 150, leads: 5, iconType: "search" },
                      { category: "Car Wrap", amount: 100, leads: 2, iconType: "car" },
                      { category: "Yard Signs", amount: 0, leads: 1, iconType: "pin" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
                            {item.iconType === "billboard" && <LayoutGrid className="w-4 h-4 text-[#1e3a5f]" />}
                            {item.iconType === "facebook" && <Facebook className="w-4 h-4 text-[#1e3a5f]" />}
                            {item.iconType === "search" && <Search className="w-4 h-4 text-[#1e3a5f]" />}
                            {item.iconType === "car" && <Home className="w-4 h-4 text-[#1e3a5f]" />}
                            {item.iconType === "pin" && <MapPin className="w-4 h-4 text-[#1e3a5f]" />}
                          </div>
                          <div>
                            <p className="font-medium">{item.category}</p>
                            <p className="text-xs text-muted-foreground">{item.leads} leads attributed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${item.amount}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.leads > 0 ? `$${(item.amount / item.leads).toFixed(0)}/lead` : "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Visual Breakdown */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-48 h-48 rounded-full border-8 border-[#1e3a5f] flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold">$850</p>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#1e3a5f]" />
                        <span>Digital: $350 (41%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#1e3a5f]/60" />
                        <span>Traditional: $500 (59%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Recent Expenses Log */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Description</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Vendor</th>
                        <th className="pb-3 font-medium text-right">Amount</th>
                        <th className="pb-3 font-medium text-right">Leads</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { date: "Jan 15", desc: "I-24 Billboard - Month 1", category: "Billboard", vendor: "Lamar", amount: 400, leads: 3 },
                        { date: "Jan 12", desc: "Facebook Campaign - Winter Special", category: "Facebook Ads", vendor: "Meta", amount: 150, leads: 8 },
                        { date: "Jan 10", desc: "Google Local Services", category: "Google Ads", vendor: "Google", amount: 100, leads: 4 },
                        { date: "Jan 8", desc: "Company Truck Wrap", category: "Car Wrap", vendor: "Sign Pro", amount: 100, leads: 2 },
                        { date: "Jan 5", desc: "Facebook Boost - Before/After", category: "Facebook Ads", vendor: "Meta", amount: 50, leads: 4 },
                        { date: "Jan 3", desc: "Google Search Ads", category: "Google Ads", vendor: "Google", amount: 50, leads: 1 },
                      ].map((expense, idx) => (
                        <tr key={idx} className="border-b border-muted/30 hover:bg-muted/20">
                          <td className="py-3">{expense.date}</td>
                          <td className="py-3">{expense.desc}</td>
                          <td className="py-3">
                            <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">{expense.vendor}</td>
                          <td className="py-3 text-right font-medium">${expense.amount}</td>
                          <td className="py-3 text-right">
                            <span className={expense.leads > 0 ? "text-green-600" : "text-muted-foreground"}>
                              {expense.leads}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* Lead Source Attribution */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Lead Source Attribution</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  When customers fill out the estimate form, they tell us how they found you. 
                  This data shows which marketing efforts are driving real leads.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {(() => {
                    const sourceLabels: Record<string, { label: string; color: string }> = {
                      google: { label: "Google", color: "bg-red-500" },
                      facebook: { label: "Facebook", color: "bg-blue-500" },
                      instagram: { label: "Instagram", color: "bg-pink-500" },
                      billboard: { label: "Billboard", color: "bg-green-500" },
                      car_wrap: { label: "Car Wrap", color: "bg-orange-500" },
                      yard_sign: { label: "Yard Sign", color: "bg-yellow-500" },
                      flyer: { label: "Flyer", color: "bg-teal-500" },
                      referral: { label: "Referral", color: "bg-purple-500" },
                      nextdoor: { label: "Nextdoor", color: "bg-emerald-500" },
                      yelp: { label: "Yelp", color: "bg-rose-500" },
                      homeadvisor: { label: "HomeAdvisor", color: "bg-cyan-500" },
                      repeat: { label: "Repeat", color: "bg-indigo-500" },
                      other: { label: "Other", color: "bg-gray-500" },
                      unknown: { label: "Not Specified", color: "bg-slate-400" },
                    };
                    
                    const sources = leadSources || {};
                    const entries = Object.entries(sources).sort((a, b) => b[1] - a[1]);
                    
                    if (entries.length === 0) {
                      return (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No lead source data yet. As customers fill out forms and select how they heard about you, the data will appear here.</p>
                        </div>
                      );
                    }
                    
                    return entries.map(([key, count], idx) => {
                      const info = sourceLabels[key] || { label: key, color: "bg-gray-500" };
                      return (
                        <div key={idx} className="text-center p-3 rounded-lg bg-muted/30">
                          <div className={`w-8 h-8 rounded-full ${info.color} mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold`}>
                            {count}
                          </div>
                          <p className="text-xs font-medium">{info.label}</p>
                        </div>
                      );
                    });
                  })()}
                </div>
              </GlassCard>

              {/* Tips for ROI Tracking */}
              <GlassCard className="p-6 bg-gradient-to-r from-[#1e3a5f]/5 to-transparent">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#1e3a5f]" />
                  Tips for Better ROI Tracking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Log expenses as soon as they happen - don't wait until month end",
                    "Ask every lead 'How did you hear about us?' on calls too",
                    "Track recurring expenses like billboard rentals separately from one-time costs",
                    "Review this data monthly to shift budget toward what's working",
                    "Compare cost-per-lead across channels to find your best performers",
                    "Document campaign names so you can compare similar campaigns over time"
                  ].map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Post
            </DialogTitle>
          </DialogHeader>
          <AddPostForm 
            onSubmit={addPost} 
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Post
            </DialogTitle>
          </DialogHeader>
          {editingPost && (
            <EditPostForm 
              post={editingPost}
              onSubmit={(updates) => updatePost(editingPost.id, updates)} 
              onCancel={() => setEditingPost(null)}
              onClaim={(name) => claimPost(editingPost.id, name)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPinChange} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-500" />
              Welcome! Set Your Secure PIN
            </DialogTitle>
          </DialogHeader>
          <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>First Login Detected!</strong> For security, please create a new PIN. 
              {userRole === "marketing" && " This will be your personal access code for the Marketing Hub."}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Your PIN must include: uppercase, lowercase, number, special character (min 6 chars)
            </p>
          </div>
          <PinChangeForm 
            onSubmit={handlePinChange}
            validateStrength={validatePinStrength}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Recently Used Content
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            This post was used within the last 4 weeks. Are you sure you want to schedule it again?
          </p>
          {duplicatePost && (
            <div className="p-3 bg-orange-50 rounded-lg text-sm">
              <p className="text-gray-700">{duplicatePost.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                Last used: {duplicatePost.lastUsed && format(new Date(duplicatePost.lastUsed), "MMM d, yyyy")}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateWarning(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => duplicatePost && confirmSchedule(duplicatePost, new Date().toISOString())}
            >
              Schedule Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Analytics Modal */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Post Analytics
            </DialogTitle>
            <DialogDescription>
              Performance details for this post
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              {/* Post Preview */}
              <div className="flex gap-4">
                {selectedPost.imageUrl ? (
                  <img src={selectedPost.imageUrl} alt="Post" className="w-24 h-24 object-cover rounded-lg" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-white/50" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedPost.platform === 'facebook' ? (
                      <Facebook className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Instagram className="w-4 h-4 text-pink-500" />
                    )}
                    <span className="text-sm font-medium capitalize">{selectedPost.platform}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedPost.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{selectedPost.message}</p>
                  {selectedPost.publishedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Published: {format(new Date(selectedPost.publishedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Eye className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-xl font-bold text-blue-600">{selectedPost.impressions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Impressions</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <Users className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                  <p className="text-xl font-bold text-purple-600">{selectedPost.reach.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Reach</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <Zap className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-xl font-bold text-orange-600">{selectedPost.clicks}</p>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 rounded bg-muted/50">
                  <p className="text-lg font-semibold">{selectedPost.likes}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <p className="text-lg font-semibold">{selectedPost.comments}</p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <p className="text-lg font-semibold">{selectedPost.shares}</p>
                  <p className="text-xs text-muted-foreground">Shares</p>
                </div>
                <div className="text-center p-2 rounded bg-muted/50">
                  <p className="text-lg font-semibold">{selectedPost.engagement}</p>
                  <p className="text-xs text-muted-foreground">Engaged</p>
                </div>
              </div>
              
              {/* Performance Percentile */}
              {(selectedPost as any).percentile !== null && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-600">Top {100 - ((selectedPost as any).percentile || 0)}% Performer</p>
                      <p className="text-sm text-muted-foreground">This post outperforms {(selectedPost as any).percentile}% of your other posts</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Action Buttons */}
          <div className="border-t pt-4 mt-4">
            <p className="text-xs text-muted-foreground mb-3">Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                onClick={() => {
                  toast({
                    title: "Removed from rotation",
                    description: "This post will no longer appear in your feed."
                  });
                  setSelectedPost(null);
                }}
                data-testid="button-remove-post"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Boost to Ad feature will be available soon."
                  });
                }}
                data-testid="button-boost-post"
              >
                <Target className="w-4 h-4 mr-1" />
                Boost as Ad
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Coming Soon", 
                    description: "Repost scheduling will be available soon."
                  });
                }}
                data-testid="button-repost"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Repost
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedPost(null)}
                data-testid="button-close-analytics"
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Queue Management Modal */}
      <Dialog open={!!selectedQueuePost} onOpenChange={(open) => !open && setSelectedQueuePost(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Queue Position #{queuePostIndex + 1}
            </DialogTitle>
            <DialogDescription>
              Manage this scheduled post - reorder, edit, or remove from queue
            </DialogDescription>
          </DialogHeader>
          
          {selectedQueuePost && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="flex gap-4">
                {selectedQueuePost.imageUrl ? (
                  <img src={selectedQueuePost.imageUrl} alt="Scheduled" className="w-24 h-24 object-cover rounded-lg" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-blue-500" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedQueuePost.platform === 'facebook' ? (
                      <Facebook className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Instagram className="w-4 h-4 text-pink-500" />
                    )}
                    <span className="text-sm font-medium capitalize">{selectedQueuePost.platform}</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Scheduled
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{selectedQueuePost.message}</p>
                </div>
              </div>
              
              {/* Scheduled Time */}
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Scheduled for: {format(new Date(selectedQueuePost.scheduledAt), 'EEEE, MMM d, yyyy h:mm a')}
                </p>
              </div>
              
              {/* Queue Position Controls */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reorder in Queue</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={queuePostIndex === 0}
                    onClick={async () => {
                      const queue = scheduledQueue?.filter(p => p.status === 'scheduled') || [];
                      if (queuePostIndex > 0) {
                        const prevPost = queue[queuePostIndex - 1];
                        // Swap scheduled times
                        await apiRequest('PATCH', `/api/scheduled-posts/${selectedQueuePost.id}`, {
                          scheduledAt: prevPost.scheduledAt
                        });
                        await apiRequest('PATCH', `/api/scheduled-posts/${prevPost.id}`, {
                          scheduledAt: selectedQueuePost.scheduledAt
                        });
                        refetchQueue();
                        toast({ title: "Moved up", description: "Post moved to an earlier slot" });
                        setSelectedQueuePost(null);
                      }
                    }}
                    className="flex-1"
                    data-testid="button-queue-move-up"
                  >
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Move Up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={queuePostIndex >= ((scheduledQueue?.filter(p => p.status === 'scheduled').length || 1) - 1)}
                    onClick={async () => {
                      const queue = scheduledQueue?.filter(p => p.status === 'scheduled') || [];
                      if (queuePostIndex < queue.length - 1) {
                        const nextPost = queue[queuePostIndex + 1];
                        // Swap scheduled times
                        await apiRequest('PATCH', `/api/scheduled-posts/${selectedQueuePost.id}`, {
                          scheduledAt: nextPost.scheduledAt
                        });
                        await apiRequest('PATCH', `/api/scheduled-posts/${nextPost.id}`, {
                          scheduledAt: selectedQueuePost.scheduledAt
                        });
                        refetchQueue();
                        toast({ title: "Moved down", description: "Post moved to a later slot" });
                        setSelectedQueuePost(null);
                      }
                    }}
                    className="flex-1"
                    data-testid="button-queue-move-down"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Move Down
                  </Button>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    await apiRequest('DELETE', `/api/scheduled-posts/${selectedQueuePost.id}`);
                    refetchQueue();
                    toast({ title: "Removed", description: "Post removed from queue" });
                    setSelectedQueuePost(null);
                  }}
                  className="flex-1"
                  data-testid="button-queue-remove"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove from Queue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQueuePost(null)}
                  data-testid="button-queue-close"
                >
                  <X className="w-4 h-4 mr-1" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Post Modal */}
      <Dialog open={showQuickPostModal} onOpenChange={setShowQuickPostModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" />
              Quick Post
            </DialogTitle>
            <DialogDescription>
              Create and send a post immediately or schedule it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Platform Selection */}
            <div>
              <Label>Platform</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={quickPostForm.platform === 'facebook' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickPostForm(p => ({ ...p, platform: 'facebook' }))}
                  className="flex-1"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  type="button"
                  variant={quickPostForm.platform === 'instagram' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickPostForm(p => ({ ...p, platform: 'instagram' }))}
                  className="flex-1"
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram
                </Button>
              </div>
            </div>
            
            {/* Image URL */}
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={quickPostForm.imageUrl}
                onChange={(e) => setQuickPostForm(p => ({ ...p, imageUrl: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              {quickPostForm.imageUrl && (
                <img src={quickPostForm.imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
              )}
            </div>
            
            {/* Message */}
            <div>
              <Label>Message</Label>
              <Textarea
                value={quickPostForm.message}
                onChange={(e) => setQuickPostForm(p => ({ ...p, message: e.target.value }))}
                placeholder="What do you want to share?"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">{quickPostForm.message.length} characters</p>
            </div>
            
            {/* AI Generation Toggle */}
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={quickPostForm.generateWithAI}
                  onChange={(e) => setQuickPostForm(p => ({ ...p, generateWithAI: e.target.checked }))}
                  className="rounded"
                />
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Generate with AI</span>
              </label>
              {quickPostForm.generateWithAI && (
                <div className="mt-3">
                  <Label>Describe what you want</Label>
                  <Textarea
                    value={quickPostForm.aiPrompt}
                    onChange={(e) => setQuickPostForm(p => ({ ...p, aiPrompt: e.target.value }))}
                    placeholder="e.g., A post about our recent kitchen cabinet project in Brentwood..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickPostModal(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch(`/api/marketing/${selectedTenant}/quick-post`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: quickPostForm.message,
                      imageUrl: quickPostForm.imageUrl || null,
                      platform: quickPostForm.platform
                    })
                  });
                  if (response.ok) {
                    toast({ title: "Post created!", description: "Your post has been queued for publishing." });
                    setShowQuickPostModal(false);
                    setQuickPostForm({ message: "", imageUrl: "", platform: "facebook", generateWithAI: false, aiPrompt: "" });
                    refetchLivePosts();
                  } else {
                    toast({ title: "Error", description: "Failed to create post", variant: "destructive" });
                  }
                } catch (error) {
                  toast({ title: "Error", description: "Failed to create post", variant: "destructive" });
                }
              }}
              disabled={!quickPostForm.message.trim() || isGeneratingPost}
            >
              {isGeneratingPost ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Image Modal */}
      <Dialog open={showAddImageModal} onOpenChange={setShowAddImageModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-green-500" />
              Add Live Image to Library
            </DialogTitle>
            <DialogDescription>
              Upload real photos from completed jobs. These go directly to your Live Images library.
            </DialogDescription>
          </DialogHeader>
          <AddImageForm 
            tenantId={selectedTenant}
            onSubmit={async (image) => {
              // Save to database with is_user_uploaded = true
              try {
                const categoryMap: Record<string, string> = {
                  "interior-walls": "interior",
                  "exterior-home": "exterior",
                  "cabinet-work": "cabinets",
                  "deck-staining": "decks",
                  "trim-detail": "trim",
                  "door-painting": "doors",
                  "commercial-space": "commercial",
                  "before-after": "before_after",
                  "team-action": "crew_at_work",
                  "general": "general",
                };
                
                const res = await fetch("/api/marketing/images", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tenantId: selectedTenant,
                    filename: `live-${Date.now()}.jpg`,
                    filePath: image.url,
                    altText: image.description,
                    category: categoryMap[image.subject] || "general",
                    subcategory: image.style,
                    tags: image.tags,
                    isUserUploaded: true,
                  }),
                });
                
                if (res.ok) {
                  queryClient.invalidateQueries({ queryKey: ["/api/marketing/images", selectedTenant] });
                  toast({ title: "Image added", description: "Added to your Live Images library" });
                  setShowAddImageModal(false);
                } else {
                  throw new Error("Failed to save");
                }
              } catch (err) {
                toast({ title: "Error", description: "Failed to add image", variant: "destructive" });
              }
            }}
            onCancel={() => setShowAddImageModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Message Modal */}
      <Dialog open={showAddMessageModal} onOpenChange={setShowAddMessageModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Add Message Template
            </DialogTitle>
          </DialogHeader>
          <AddMessageForm 
            onSubmit={(message) => {
              const newMessage: MessageTemplate = {
                ...message,
                id: `msg-${Date.now()}`,
                brand: selectedTenant,
                createdAt: new Date().toISOString(),
              };
              const updated = [...messageTemplates, newMessage];
              setMessageTemplates(updated);
              localStorage.setItem("marketing_messages", JSON.stringify(updated));
              setShowAddMessageModal(false);
            }}
            onCancel={() => setShowAddMessageModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Metrics Editing Modal */}
      <Dialog open={!!editingMetricsBundle} onOpenChange={(open) => !open && setEditingMetricsBundle(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {editingMetricsBundle?.metrics ? "Edit Metrics" : "Add Metrics"}
            </DialogTitle>
            <DialogDescription>
              Enter the engagement data from your social media platform. This helps track what content performs best.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Where to find this data */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-800 dark:text-blue-200">
              <strong>Where to find these numbers:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li><strong>Facebook:</strong> Click on post → View Insights</li>
                <li><strong>Instagram:</strong> Tap post → View Insights</li>
                <li><strong>Nextdoor:</strong> Check post engagement stats</li>
              </ul>
            </div>

            {/* Engagement Metrics */}
            <div>
              <h4 className="text-sm font-medium mb-2">Engagement</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Impressions</Label>
                  <Input 
                    type="number" 
                    value={metricsForm.impressions}
                    onChange={(e) => setMetricsForm({...metricsForm, impressions: Math.max(0, parseInt(e.target.value) || 0)})}
                    data-testid="input-impressions"
                  />
                </div>
                <div>
                  <Label className="text-xs">Reach</Label>
                  <Input 
                    type="number" 
                    value={metricsForm.reach}
                    onChange={(e) => setMetricsForm({...metricsForm, reach: Math.max(0, parseInt(e.target.value) || 0)})}
                    data-testid="input-reach"
                  />
                </div>
                <div>
                  <Label className="text-xs">Clicks</Label>
                  <Input 
                    type="number" 
                    value={metricsForm.clicks}
                    onChange={(e) => setMetricsForm({...metricsForm, clicks: Math.max(0, parseInt(e.target.value) || 0)})}
                    data-testid="input-clicks"
                  />
                </div>
              </div>
            </div>

            {/* Social Interactions */}
            <div>
              <h4 className="text-sm font-medium mb-2">Social Interactions</h4>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Likes</Label>
                  <Input 
                    type="number" 
                    value={metricsForm.likes}
                    onChange={(e) => setMetricsForm({...metricsForm, likes: Math.max(0, parseInt(e.target.value) || 0)})}
                    data-testid="input-likes"
                  />
                </div>
                <div>
                  <Label className="text-xs">Comments</Label>
                  <Input 
                    type="number" 
                    value={metricsForm.comments}
                    onChange={(e) => setMetricsForm({...metricsForm, comments: Math.max(0, parseInt(e.target.value) || 0)})}
                    data-testid="input-comments"
                  />
                </div>
                <div>
                  <Label className="text-xs">Shares</Label>
                  <Input 
                    type="number" 
                    value={metricsForm.shares}
                    onChange={(e) => setMetricsForm({...metricsForm, shares: Math.max(0, parseInt(e.target.value) || 0)})}
                    data-testid="input-shares"
                  />
                </div>
                <div>
                  <Label className="text-xs">Saves</Label>
                  <Input 
                    type="number" 
                    value={metricsForm.saves}
                    onChange={(e) => setMetricsForm({...metricsForm, saves: Math.max(0, parseInt(e.target.value) || 0)})}
                    data-testid="input-saves"
                  />
                </div>
              </div>
            </div>

            {/* Business Results */}
            <div>
              <h4 className="text-sm font-medium mb-2">Business Results</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Leads Generated</Label>
                  <Input 
                    type="number" 
                    value={metricsForm.leads}
                    onChange={(e) => setMetricsForm({...metricsForm, leads: Math.max(0, parseInt(e.target.value) || 0)})}
                    data-testid="input-leads"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Inquiries from this post</p>
                </div>
                <div>
                  <Label className="text-xs">Conversions</Label>
                  <Input 
                    type="number" 
                    value={metricsForm.conversions}
                    onChange={(e) => setMetricsForm({...metricsForm, conversions: Math.max(0, parseInt(e.target.value) || 0)})}
                    data-testid="input-conversions"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Jobs booked from this post</p>
                </div>
              </div>
            </div>

            {/* Ad Spend (for paid ads) */}
            {editingMetricsBundle?.postType === "paid_ad" && (
              <div>
                <h4 className="text-sm font-medium mb-2">Ad Spend</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Amount Spent ($)</Label>
                    <Input 
                      type="number" 
                      value={metricsForm.spend}
                      onChange={(e) => setMetricsForm({...metricsForm, spend: Math.max(0, parseFloat(e.target.value) || 0)})}
                      data-testid="input-spend"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Revenue Generated ($)</Label>
                    <Input 
                      type="number" 
                      value={metricsForm.revenue}
                      onChange={(e) => setMetricsForm({...metricsForm, revenue: Math.max(0, parseFloat(e.target.value) || 0)})}
                      data-testid="input-revenue"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMetricsBundle(null)} data-testid="button-cancel-metrics">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingMetricsBundle) {
                  const updated = contentBundles.map(b => 
                    b.id === editingMetricsBundle.id 
                      ? {...b, metrics: metricsForm, postedAt: b.postedAt || new Date().toISOString()} 
                      : b
                  );
                  setContentBundles(updated);
                  localStorage.setItem("marketing_bundles", JSON.stringify(updated));
                  toast({
                    title: "Metrics Saved",
                    description: "Performance data has been recorded for this content."
                  });
                  setEditingMetricsBundle(null);
                }
              }}
              data-testid="button-save-metrics"
            >
              Save Metrics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Agent Tab - Side tab that expands to full agent */}
      <AIAgentTab />
    </PageLayout>
  );
}

// Add Image Form Component
function AddImageForm({ tenantId, onSubmit, onCancel }: {
  tenantId?: string;
  onSubmit: (image: Omit<LibraryImage, "id" | "brand" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState<ImageSubject>("general");
  const [style, setStyle] = useState<ImageStyle>("finished-result");
  const [season, setSeason] = useState<ImageSeason>("all-year");
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [tags, setTags] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Image URL</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          data-testid="input-library-image-url"
        />
        {url && (
          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <img src={url} alt="Preview" className="w-full h-32 object-cover rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
        )}
      </div>
      <div>
        <Label>Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the image"
          data-testid="input-image-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Subject</Label>
          <Select value={subject} onValueChange={(v) => setSubject(v as ImageSubject)}>
            <SelectTrigger data-testid="select-image-subject-form">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_SUBJECTS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Style</Label>
          <Select value={style} onValueChange={(v) => setStyle(v as ImageStyle)}>
            <SelectTrigger data-testid="select-image-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_STYLES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Season</Label>
          <Select value={season} onValueChange={(v) => setSeason(v as ImageSeason)}>
            <SelectTrigger data-testid="select-image-season">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_SEASONS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Quality (1-5)</Label>
          <Select value={String(quality)} onValueChange={(v) => setQuality(Number(v) as 1|2|3|4|5)}>
            <SelectTrigger data-testid="select-image-quality">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} Star{n > 1 ? 's' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Tags (comma separated)</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="modern, clean, residential"
          data-testid="input-image-tags"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSubmit({ url, description, subject, style, season, quality, tags: tags.split(",").map(t => t.trim()).filter(Boolean) })}
          disabled={!url.trim()}
          data-testid="button-submit-image"
        >
          Add Image
        </Button>
      </DialogFooter>
    </div>
  );
}

// Add Message Form Component
function AddMessageForm({ onSubmit, onCancel }: {
  onSubmit: (message: Omit<MessageTemplate, "id" | "brand" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState<ImageSubject>("general");
  const [tone, setTone] = useState<MessageTone>("professional");
  const [cta, setCta] = useState<MessageCTA>("none");
  const [platform, setPlatform] = useState<"instagram" | "facebook" | "nextdoor" | "all">("all");
  const [hashtags, setHashtags] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Message Content</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your message template..."
          rows={4}
          data-testid="textarea-message-content"
        />
        <p className="text-xs text-gray-500 mt-1">{content.length} characters</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Subject Match</Label>
          <Select value={subject} onValueChange={(v) => setSubject(v as ImageSubject)}>
            <SelectTrigger data-testid="select-message-subject-form">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_SUBJECTS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tone</Label>
          <Select value={tone} onValueChange={(v) => setTone(v as MessageTone)}>
            <SelectTrigger data-testid="select-message-tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESSAGE_TONES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Call to Action</Label>
          <Select value={cta} onValueChange={(v) => setCta(v as MessageCTA)}>
            <SelectTrigger data-testid="select-message-cta">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESSAGE_CTAS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Platform</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
            <SelectTrigger data-testid="select-message-platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="nextdoor">Nextdoor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Hashtags (comma separated)</Label>
        <Input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#NashvillePainting, #HomeImprovement"
          data-testid="input-message-hashtags"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSubmit({ content, subject, tone, cta, platform, hashtags: hashtags.split(",").map(h => h.trim()).filter(Boolean) })}
          disabled={!content.trim()}
          data-testid="button-submit-message"
        >
          Add Message
        </Button>
      </DialogFooter>
    </div>
  );
}

function AddPostForm({ onSubmit, onCancel }: { 
  onSubmit: (post: Partial<SocialPost>) => void; 
  onCancel: () => void;
}) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [type, setType] = useState("evergreen");
  const [category, setCategory] = useState("general");

  return (
    <div className="space-y-4">
      <div>
        <Label>Platform</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger data-testid="select-add-platform">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="nextdoor">Nextdoor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger data-testid="select-add-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="evergreen">Evergreen (Permanent Rotation)</SelectItem>
            <SelectItem value="seasonal">Seasonal (Weekly Review)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-testid="select-add-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Image URL (optional)</Label>
        <Input 
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg or leave blank"
          data-testid="input-image-url"
        />
        {imageUrl && (
          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-32 object-cover rounded"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">Paste a URL to an image, or upload to a service and paste the link</p>
      </div>
      <div>
        <Label>Message Content</Label>
        <Textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your social media message..."
          rows={4}
          data-testid="textarea-post-content"
        />
        <p className="text-xs text-gray-500 mt-1">{content.length} characters</p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={() => onSubmit({ 
            content, 
            imageUrl: imageUrl || undefined,
            platform: platform as any, 
            type: type as any, 
            category: category as any 
          })}
          disabled={!content.trim()}
          data-testid="button-submit-post"
        >
          Add Post
        </Button>
      </DialogFooter>
    </div>
  );
}

function EditPostForm({ post, onSubmit, onCancel, onClaim }: { 
  post: SocialPost;
  onSubmit: (updates: Partial<SocialPost>) => void; 
  onCancel: () => void;
  onClaim: (name: string) => void;
}) {
  const [content, setContent] = useState(post.content);
  const [platform, setPlatform] = useState(post.platform);
  const [type, setType] = useState(post.type);
  const [category, setCategory] = useState(post.category);
  const [claimName, setClaimName] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label>Platform</Label>
        <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="nextdoor">Nextdoor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="evergreen">Evergreen (Permanent Rotation)</SelectItem>
            <SelectItem value="seasonal">Seasonal (Weekly Review)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Message Content</Label>
        <Textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">{content.length} characters</p>
      </div>
      
      <div className="border-t pt-4">
        <Label>Claim This Post</Label>
        <div className="flex gap-2 mt-1">
          <Input 
            placeholder="Your name"
            value={claimName}
            onChange={(e) => setClaimName(e.target.value)}
          />
          <Button 
            variant="outline" 
            onClick={() => {
              if (claimName.trim()) {
                onClaim(claimName.trim());
              }
            }}
            disabled={!claimName.trim()}
          >
            Claim
          </Button>
        </div>
        {post.claimedBy && (
          <p className="text-xs text-purple-600 mt-1">Currently claimed by: {post.claimedBy}</p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={() => onSubmit({ content, platform, type, category })}
          disabled={!content.trim()}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
}

function PinChangeForm({ onSubmit, validateStrength }: { 
  onSubmit: (pin: string) => void;
  validateStrength: (pin: string) => boolean;
}) {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!validateStrength(newPin)) {
      setError("PIN must have uppercase, lowercase, number, and special character (min 6 chars)");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
    onSubmit(newPin);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Create a secure PIN with at least:
      </p>
      <ul className="text-xs text-gray-500 list-disc list-inside">
        <li>One uppercase letter</li>
        <li>One lowercase letter</li>
        <li>One number</li>
        <li>One special character (!@#$%^&*)</li>
        <li>Minimum 6 characters</li>
      </ul>
      <div>
        <Label>New PIN</Label>
        <Input 
          type="password"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          placeholder="Enter new PIN"
          data-testid="input-new-pin"
        />
      </div>
      <div>
        <Label>Confirm PIN</Label>
        <Input 
          type="password"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          placeholder="Confirm new PIN"
          data-testid="input-confirm-pin"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <DialogFooter>
        <Button onClick={handleSubmit} data-testid="button-save-pin">Save PIN</Button>
      </DialogFooter>
    </div>
  );
}
