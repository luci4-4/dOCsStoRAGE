import {
  Home, Search, Star, History, FileText, User, Package, Upload, Tag, List,
  Users, BarChart3, Settings, LogOut, Moon, Sun, BookOpen, Eye, Trash2,
  Plus, Pencil, Download, Link2, FileDown, X, AlertCircle, CheckCircle2,
  ClipboardList, Layers, Server, Filter, ChevronRight,
} from 'lucide-react'

const MAP = {
  home: Home,
  search: Search,
  star: Star,
  history: History,
  note: FileText,
  user: User,
  package: Package,
  upload: Upload,
  tag: Tag,
  list: List,
  users: Users,
  chart: BarChart3,
  cog: Settings,
  logout: LogOut,
  moon: Moon,
  sun: Sun,
  book: BookOpen,
  eye: Eye,
  trash: Trash2,
  plus: Plus,
  edit: Pencil,
  download: Download,
  link: Link2,
  export: FileDown,
  close: X,
  alert: AlertCircle,
  check: CheckCircle2,
  clipboard: ClipboardList,
  layers: Layers,
  server: Server,
  filter: Filter,
  chevron: ChevronRight,
}

export default function Icon({ name, size = 16, className = '', strokeWidth = 2, ...props }) {
  const C = MAP[name] || FileText
  return <C size={size} className={className} strokeWidth={strokeWidth} {...props} />
}
