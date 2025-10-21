
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'


// Loading component for Suspense fallback
function LoginPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to IELTS Test</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const Loading = () => {
    return (
        <LoginPageLoading />
    );
}

export default Loading;