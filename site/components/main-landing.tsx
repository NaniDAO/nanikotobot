import { Badge } from "@/components/ui/badge"

export default function MainLanding() {
  return (
    <section className="text-center py-12">
      <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200">
        AI Agent Dashboard
      </h1>
      <p className="text-xl mb-8 text-gray-400">
        Advanced AI agent for corporate operations and financial transactions
      </p>
      <Badge variant="outline" className="text-green-400 border-green-400">
        Online
      </Badge>
    </section>
  )
}

