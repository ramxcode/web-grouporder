/**
 * Icon wrapper -- menggunakan lucide-react
 * Gunakan: <Icon name="LayoutDashboard" size={18} />
 */
import * as LucideIcons from 'lucide-react';

export default function Icon({ name, size = 16, style = {}, className = '', ...rest }) {
  const LucideIcon = LucideIcons[name];

  if (!LucideIcon) {
    // Fallback: tampilkan tanda tanya jika icon tidak ditemukan
    const Fallback = LucideIcons['CircleHelp'] || LucideIcons['HelpCircle'];
    if (!Fallback) return null;
    return <Fallback size={size} style={style} className={className} {...rest} />;
  }

  return <LucideIcon size={size} style={style} className={className} {...rest} />;
}
