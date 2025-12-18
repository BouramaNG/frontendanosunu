/**
 * Centralized icon exports to optimize bundle size
 *
 * Instead of importing the entire lucide-react library (980 KB),
 * we only export the icons actually used in the app (~50 KB)
 *
 * Usage:
 * import { Lock, Plus, X } from '@/lib/icons';
 */

export {
  // Navigation & UI
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Search,
  ExternalLink,
  Filter,

  // Actions
  Check,
  CheckCircle,
  CheckCircle2,
  Send,
  Reply,
  Share2,
  Copy,
  Upload,
  Shuffle,
  Edit,
  Undo2,
  RefreshCw,
  ArchiveRestore,

  // Media
  Image,
  Image as ImageIcon,
  Video,
  Mic,
  Square,
  Play,
  Smile,
  Sticker,
  Palette,
  Volume2,
  VolumeX,

  // Security & Privacy
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  ShieldQuestion,
  Key,
  Eye,
  EyeOff,
  LogIn,

  // Social
  Heart,
  Users,
  User,
  UserPlus,
  MessageCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Crown,
  Star,
  Sparkles,
  Award,
  Facebook,
  Twitter,
  Globe,

  // Status & Alerts
  AlertCircle,
  AlertTriangle,
  Loader2,
  Flag,
  Ban,
  Bell,
  BellRing,
  Activity,

  // Content Actions
  Trash2,
  MoreVertical,
  ZoomIn,
  XCircle,

  // Info & Help
  HelpCircle,

  // Misc
  Clock,
  Code,
  FileText,
  Scale,
  TrendingUp,
  Zap,
  Flame,
  Home,
  Mail,
  Calendar,
  DollarSign,
  Phone,
  Hash,
  BookMarked,
  BarChart3,

  // Links
  Link,
  Link as LinkIcon,
} from 'lucide-react';
