import Icon from './Icon'

export default function PageHeader({ icon, title, subtitle, actions, children }) {
  return (
    <div className="page-header page-header-row">
      <div>
        <div className="page-title">
          {icon && <Icon name={icon} size={22} className="page-title-icon" />}
          {title || children}
        </div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}
