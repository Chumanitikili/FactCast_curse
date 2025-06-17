import Link from "next/link"
import { Check, Mic, MessageSquare, Volume2, Smartphone, Headphones, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Navigation */}
      <header className="container mx-auto py-6 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-emerald-500" />
          <span className="text-xl font-bold">TruthCast</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/live-assistant" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Live Assistant
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-zinc-400 hover:text-white" asChild>
            <Link href="/live-assistant">Try Live Demo</Link>
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-black">Get Started</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 py-20 md:py-32 flex flex-col items-center text-center">
        <Badge className="mb-4 bg-zinc-800 text-emerald-500 hover:bg-zinc-800">
          🎙️ TruthCast Real-Time Multi-Modal AI
        </Badge>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
          Voice & Text AI <span className="text-emerald-500">Fact-Checking</span> for Live Podcasts
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-[800px] mb-10">
          TruthCast is the first AI assistant that understands both voice commands and text input. Get instant
          fact-checks during live recordings with private audio feedback and 3-source verification.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-black h-12 px-8 rounded-full" asChild>
            <Link href="/live-assistant">Start Live Session</Link>
          </Button>
          <Button
            variant="outline"
            className="border-zinc-700 text-white hover:bg-zinc-800 h-12 px-8 rounded-full"
            asChild
          >
            <Link href="/mobile-companion">Mobile App</Link>
          </Button>
        </div>

        <div className="mt-20 relative w-full max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
          <img
            src="/placeholder.svg?height=720&width=1280"
            alt="FactBot AI Multi-Modal Dashboard"
            className="w-full h-auto rounded-xl border border-zinc-800 shadow-2xl"
          />
        </div>
      </section>

      {/* Multi-Modal Features Section */}
      <section id="features" className="container mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Multi-Modal AI Capabilities</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            The only fact-checking assistant that seamlessly combines voice commands, text input, and audio feedback for
            the ultimate podcasting experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Mic className="h-10 w-10 text-emerald-500" />}
            title="Voice Commands"
            description="Say 'Hey FactBot, check...' and get instant verification without interrupting your flow."
            features={["Wake word detection", "Natural speech processing", "Real-time transcription"]}
          />
          <FeatureCard
            icon={<MessageSquare className="h-10 w-10 text-emerald-500" />}
            title="Text Input"
            description="Type claims manually or copy-paste from scripts for quick verification."
            features={["Manual fact-checking", "Batch processing", "Copy-paste support"]}
          />
          <FeatureCard
            icon={<Volume2 className="h-10 w-10 text-emerald-500" />}
            title="Audio Feedback"
            description="Get whispered responses through earbuds without disrupting your recording."
            features={["Private audio alerts", "Customizable voice", "Silent mode option"]}
          />
          <FeatureCard
            icon={<Smartphone className="h-10 w-10 text-emerald-500" />}
            title="Mobile Companion"
            description="Control everything from your smartphone with full voice and text support."
            features={["iOS & Android apps", "Remote control", "Quick actions"]}
          />
          <FeatureCard
            icon={<Headphones className="h-10 w-10 text-emerald-500" />}
            title="Smart Audio Routing"
            description="Choose between private earbuds or speaker output based on your setup."
            features={["Earbuds integration", "Speaker mode", "Audio mixing"]}
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-emerald-500" />}
            title="3-Source Verification"
            description="Every fact-check includes exactly 3 credible sources with reliability scores."
            features={["Multi-source analysis", "Credibility scoring", "Source diversity"]}
          />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-zinc-900 py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Multi-Modal Fact-Checking Works</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Experience the future of podcast fact-checking with seamless voice and text interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <WorkflowStep
              number="01"
              title="Choose Your Mode"
              description="Select voice-only, text-only, hybrid, or passive mode based on your recording setup."
              icon={<MessageSquare className="h-6 w-6" />}
            />
            <WorkflowStep
              number="02"
              title="Speak or Type"
              description="Use voice commands like 'Hey FactBot, check...' or type claims manually for verification."
              icon={<Mic className="h-6 w-6" />}
            />
            <WorkflowStep
              number="03"
              title="Get Multi-Modal Results"
              description="Receive visual displays and optional audio feedback with 3-source verification in under 3 seconds."
              icon={<Volume2 className="h-6 w-6" />}
            />
          </div>

          <div className="mt-20 relative w-full max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-10 pointer-events-none" />
            <img
              src="/placeholder.svg?height=600&width=1080"
              alt="Multi-Modal Workflow"
              className="w-full h-auto rounded-xl border border-zinc-800 shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Interaction Examples */}
      <section className="container mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Real Interaction Examples</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            See how podcasters use voice commands and text input for seamless fact-checking.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InteractionExample
            type="Voice Command"
            icon={<Mic className="h-5 w-5 text-emerald-500" />}
            scenario="During live recording"
            input="'Hey FactBot, check that coffee consumption stat'"
            output="🎧 Audio: 'That's incorrect. Coffee grew 15%, not 400%. Check your screen.'"
            visual="📊 Visual: Sources from ICO, USDA, Statista displayed"
          />

          <InteractionExample
            type="Text Input"
            icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
            scenario="Manual verification"
            input="Types: 'renewable energy percentage US 2023'"
            output="📱 Mobile: Instant fact-check with 3 sources"
            visual="✅ Result: 21.4% verified with high confidence"
          />

          <InteractionExample
            type="Hybrid Mode"
            icon={<Volume2 className="h-5 w-5 text-purple-500" />}
            scenario="Auto-detection + voice"
            input="AI detects: 'Electric cars produce zero emissions'"
            output="🔔 Alert: 'Partially correct - check screen for details'"
            visual="⚠️ Visual: Nuanced explanation with sources"
          />

          <InteractionExample
            type="Mobile Companion"
            icon={<Smartphone className="h-5 w-5 text-orange-500" />}
            scenario="Remote control"
            input="Tap 'Read Sources' on phone"
            output="🎧 Audio: Reads all 3 sources aloud through earbuds"
            visual="📱 Mobile: Source details with credibility scores"
          />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Multi-Modal Pricing</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Choose the plan that fits your podcasting needs with full voice and text capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard
            title="Voice Starter"
            price="$29"
            description="Perfect for solo podcasters"
            features={[
              "Voice commands + text input",
              "5 hours of live fact-checking",
              "Basic audio feedback",
              "Mobile companion app",
              "3-source verification",
            ]}
            buttonText="Start Free Trial"
            buttonVariant="outline"
          />
          <PricingCard
            title="Multi-Modal Pro"
            price="$79"
            description="For professional podcasters"
            features={[
              "All voice + text features",
              "25 hours of live fact-checking",
              "Premium voice synthesis",
              "Private audio routing",
              "Advanced voice commands",
              "Custom wake words",
              "Priority processing",
            ]}
            buttonText="Start Free Trial"
            buttonVariant="default"
            highlighted={true}
          />
          <PricingCard
            title="Studio Enterprise"
            price="$199"
            description="For podcast networks"
            features={[
              "Unlimited fact-checking",
              "Multi-host voice recognition",
              "Custom voice training",
              "API access",
              "Team management",
              "Advanced analytics",
              "24/7 support",
            ]}
            buttonText="Contact Sales"
            buttonVariant="outline"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-500 py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
            Ready for Multi-Modal Fact-Checking with TruthCast?
          </h2>
          <p className="text-black/80 text-lg max-w-2xl mx-auto mb-10">
            Join the future of podcasting with TruthCast's voice commands, text input, and audio feedback all working
            together seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-black text-white hover:bg-zinc-800 h-12 px-8 rounded-full" asChild>
              <Link href="/live-assistant">Try Live Demo</Link>
            </Button>
            <Button
              variant="outline"
              className="border-black text-black hover:bg-black/10 h-12 px-8 rounded-full"
              asChild
            >
              <Link href="/mobile-companion">Download Mobile App</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-emerald-500" />
              <span className="text-lg font-bold">TruthCast</span>
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 text-center text-zinc-500 text-sm">
            © 2025 TruthCast. The first multi-modal fact-checking assistant for podcasters.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, features }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-zinc-400 mb-4">{description}</CardDescription>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm">
              <Check className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function WorkflowStep({ number, title, description, icon }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 relative">
        <span className="text-emerald-500 text-xl font-bold">{number}</span>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  )
}

function InteractionExample({ type, icon, scenario, input, output, visual }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {type}
        </CardTitle>
        <CardDescription>{scenario}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-zinc-300">Input:</p>
          <p className="text-sm text-zinc-400">{input}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-300">Audio Output:</p>
          <p className="text-sm text-zinc-400">{output}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-300">Visual Display:</p>
          <p className="text-sm text-zinc-400">{visual}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PricingCard({ title, price, description, features, buttonText, buttonVariant, highlighted = false }) {
  return (
    <Card
      className={`${highlighted ? "border-emerald-500 bg-zinc-900" : "bg-zinc-900 border-zinc-800"} relative overflow-hidden`}
    >
      {highlighted && <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />}
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <div className="mt-4 flex items-baseline">
          <span className="text-4xl font-bold">{price}</span>
          <span className="ml-1 text-zinc-400">/month</span>
        </div>
        <CardDescription className="mt-2 text-zinc-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          variant={buttonVariant}
          className={`w-full ${buttonVariant === "default" ? "bg-emerald-500 hover:bg-emerald-600 text-black" : "border-zinc-700"}`}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  )
}
