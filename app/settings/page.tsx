"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Mic, Save, RotateCcw } from "lucide-react"
import type { SessionSettings } from "@/lib/realtime-types"

export default function SettingsPage() {
  const [settings, setSettings] = useState<SessionSettings>({
    autoFactCheck: true,
    voiceActivation: true,
    hotkey: "KeyF",
    confidenceThreshold: 70,
    sourceTypes: ["news", "academic", "government"],
    maxSourcesPerCheck: 5,
    voiceOutput: true,
    realTimeTranscript: true
  })

  const [hasChanges, setHasChanges] = useState(false)

  const updateSetting = <K extends keyof SessionSettings>(
    key: K, 
    value: SessionSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSourceTypeChange = (sourceType: string, checked: boolean) => {
    const newSourceTypes = checked 
      ? [...settings.sourceTypes, sourceType]
      : settings.sourceTypes.filter(type => type !== sourceType)
    
    updateSetting('sourceTypes', newSourceTypes)
  }

  const saveSettings = () => {
    // In production, save to backend
    localStorage.setItem('truthcast_settings', JSON.stringify(settings))
    setHasChanges(false)
    alert('Settings saved successfully!')
  }

  const resetSettings = () => {
    const defaultSettings: SessionSettings = {
      autoFactCheck: true,
      voiceActivation: true,
      hotkey: "KeyF",
      confidenceThreshold: 70,
      sourceTypes: ["news", "academic", "government"],
      maxSourcesPerCheck: 5,
      voiceOutput: true,
      realTimeTranscript: true
    }
    
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  const sourceTypeOptions = [
    { id: "news", label: "News Articles", description: "Major news outlets and publications" },
    { id: "academic", label: "Academic Papers", description: "Peer-reviewed research and studies" },
    { id: "government", label: "Government Sources", description: "Official government data and reports" },
    { id: "blog", label: "Expert Blogs", description: "Verified expert and industry blogs" },
    { id: "social", label: "Social Media", description: "Verified social media accounts" },
    { id: "other", label: "Other Sources", description: "Additional verified sources" }
  ]

  const hotkeyOptions = [
    { value: "KeyF", label: "F" },
    { value: "KeyG", label: "G" },
    { value: "KeyH", label: "H" },
    { value: "KeyJ", label: "J" },
    { value: "KeyK", label: "K" },
    { value: "Space", label: "Space" }
  ]

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-zinc-400">Configure your real-time fact-checking preferences</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={resetSettings}
              className="border-zinc-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={saveSettings}
              disabled={!hasChanges}
              className="bg-emerald-500 hover:bg-emerald-600 text-black"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audio & Voice Settings */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Audio & Voice
              </CardTitle>
              <CardDescription>
                Configure audio input and voice activation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Real-time Transcription</Label>
                  <p className="text-xs text-zinc-400">Enable live speech-to-text</p>
                </div>
                <Switch
                  checked={settings.realTimeTranscript}
                  onCheckedChange={(checked) => updateSetting('realTimeTranscript', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Voice Activation</Label>
                  <p className="text-xs text-zinc-400">Enable voice commands</p>
                </div>
                <Switch
                  checked={settings.voiceActivation}
                  onCheckedChange={(checked) => updateSetting('voiceActivation', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Hotkey for Manual Fact-Check</Label>
                <Select 
                  value={settings.hotkey} 
                  onValueChange={(value) => updateSetting('hotkey', value)}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hotkeyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        Ctrl + {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-400">Press this key combination to trigger fact-checking</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Voice Output</Label>
                  <p className="text-xs text-zinc-400">Spoken alerts for flagged content</p>
                </div>
                <Switch
                  checked={settings.voiceOutput}
                  onCheckedChange={(checked) => updateSetting('voiceOutput\', checked)}
