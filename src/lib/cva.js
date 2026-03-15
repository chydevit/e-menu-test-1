// Minimal `class-variance-authority`-compatible helper used by shadcn-style components.
// Supports `variants` + `defaultVariants` and an optional `className` prop.
export function cva(base, config = {}) {
  const variants = config.variants ?? {}
  const defaultVariants = config.defaultVariants ?? {}

  return (props = {}) => {
    const classNames = [base]

    for (const variantKey of Object.keys(variants)) {
      const variantGroup = variants[variantKey]
      const variantValue = props[variantKey] ?? defaultVariants[variantKey]
      if (variantValue && variantGroup?.[variantValue]) {
        classNames.push(variantGroup[variantValue])
      }
    }

    if (props.className) classNames.push(props.className)
    return classNames.filter(Boolean).join(" ")
  }
}

