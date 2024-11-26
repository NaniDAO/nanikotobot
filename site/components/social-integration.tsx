import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Twitter, DiscIcon as Discord, Wallet } from 'lucide-react'

export default function SocialIntegration() {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-200">Social Integration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Twitter className="text-blue-400" />
            <span>Latest Tweet: "Enhancing AI capabilities..."</span>
          </div>
          <div className="flex items-center space-x-2">
            <Discord className="text-indigo-400" />
            <span>Discord: 1,337 members online</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wallet className="text-green-400" />
            <span>Last transaction: 0.5 ETH received</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

