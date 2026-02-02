import { TouchableOpacity, Text, ActivityIndicator, type ViewStyle } from 'react-native'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  style?: ViewStyle
}

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-indigo-600',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-white border border-gray-200',
    text: 'text-gray-700',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-indigo-600',
  },
}

const sizeClasses: Record<string, { container: string; text: string }> = {
  sm: { container: 'px-3 py-2 rounded-lg', text: 'text-sm' },
  md: { container: 'px-5 py-3 rounded-xl', text: 'text-base' },
  lg: { container: 'px-6 py-3.5 rounded-xl', text: 'text-base' },
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  size = 'md',
  className = '',
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const v = variantClasses[variant]
  const s = sizeClasses[size]

  return (
    <TouchableOpacity
      className={`items-center justify-center flex-row ${s.container} ${v.container} ${
        isDisabled ? 'opacity-50' : ''
      } ${className}`}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={style}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#ffffff' : '#4f46e5'}
          style={{ marginRight: 8 }}
        />
      )}
      <Text className={`font-semibold ${s.text} ${v.text}`}>{title}</Text>
    </TouchableOpacity>
  )
}
