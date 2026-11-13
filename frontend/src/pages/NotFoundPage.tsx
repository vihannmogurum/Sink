import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200 text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-3">
            <AlertCircle className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            404 — Route Not Found
          </CardTitle>
          <CardDescription className="text-slate-500">
            The requested client route is outside the mapped territory.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          <p>
            No active route handler exists at this path. All navigation links are safeguarded with client-side catch-all fallbacks.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/app/map')}
            className="w-full sm:w-auto gap-2"
          >
            <Home className="h-4 w-4" /> Return to Map
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
