"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { SplashScreen } from "./splash-screen"

interface SplashScreenContextType {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const SplashScreenContext = createContext<SplashScreenContextType>({
  isLoading: true,
  setIsLoading: () => {},
})

export const useSplashScreen = () => useContext(SplashScreenContext)

export function SplashScreenProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  // Check if this is the first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem("truthcast_visited")
    if (hasVisited) {
      setShowSplash(false)
      setIsLoading(false)
    } else {
      localStorage.setItem("truthcast_visited", "true")
    }
  }, [])

  return (
    <SplashScreenContext.Provider value={{ isLoading, setIsLoading }}>
      {showSplash ? <SplashScreen onComplete={() => setShowSplash(false)} /> : children}
    </SplashScreenContext.Provider>
  )
}
