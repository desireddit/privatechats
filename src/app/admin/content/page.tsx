// src/app/admin/content/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function AdminContentPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Private Content</h1>
          <p className="text-muted-foreground">
            Manage and upload your exclusive videos and images.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Upload New Content
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Library</CardTitle>
          <CardDescription>
            A list of all your uploaded private content will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* We will build the content table/grid here in the next step */}
          <p className="text-center text-muted-foreground py-12">
            No content uploaded yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}