"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      theme="light"
      className="renderwood-toaster"
      duration={2500}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "renderwood-toast",
          title: "renderwood-toast-title",
          description: "renderwood-toast-description",
          closeButton: "renderwood-toast-close",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
