import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from "react";

type Variant = "primary" | "glass" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface StyleProps {
  variant?: Variant;
  size?: Size;
  icon?: boolean;
  block?: boolean;
  active?: boolean;
}

function classes({ variant = "glass", size = "md", icon, block, active }: StyleProps, extra?: string) {
  return [
    "btn",
    `btn--${variant}`,
    size !== "md" && `btn--${size}`,
    icon && "btn--icon",
    block && "btn--block",
    active && "btn--active",
    extra
  ]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleProps {
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, icon, block, active, loading, className, children, disabled, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes({ variant, size, icon, block, active }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner" aria-hidden /> : null}
      {children}
    </button>
  );
});

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

export function ButtonLink({ variant, size, icon, block, active, className, ...rest }: ButtonLinkProps) {
  return <Link className={classes({ variant, size, icon, block, active }, className)} {...rest} />;
}
