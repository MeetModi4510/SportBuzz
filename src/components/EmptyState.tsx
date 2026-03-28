import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState = ({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) => (
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          {icon || <AlertCircle className="h-12 w-12 text-muted-foreground" />}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action && <div className="pt-4">{action}</div>}
      </div>
    </CardContent>
  </Card>
);
