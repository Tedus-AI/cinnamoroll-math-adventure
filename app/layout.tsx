import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"大耳狗的雲朵除法冒險",description:"以四位數除法為主的 iPad 數學遊戲"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><body>{children}</body></html>}
