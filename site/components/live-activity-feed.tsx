import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const mockLogs = [
  { id: '1', timestamp: '2023-11-23T12:00:00Z', message: 'System initialized' },
  { id: '2', timestamp: '2023-11-23T12:01:00Z', message: 'New user registered' },
  { id: '3', timestamp: '2023-11-23T12:02:00Z', message: 'Transaction processed' },
  { id: '4', timestamp: '2023-11-23T12:03:00Z', message: 'AI model updated' },
  { id: '5', timestamp: '2023-11-23T12:04:00Z', message: 'Security check completed' },
]

export default function LiveActivityFeed() {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-200">Live Activity Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-sm h-64 overflow-y-auto space-y-2">
          {mockLogs.map((log) => (
            <div 
              key={log.id} 
              className="text-green-400 px-2 py-1 rounded bg-gray-800/50"
            >
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

