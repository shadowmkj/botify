import GroupExtraction from "@/components/group-extraction";

export default function GroupExtractionPage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Group Extraction</h2>
        <p className="text-muted-foreground">Coming Soon ---.</p>
        <p className="text-muted-foreground">
          We don’t have an ETA yet, but it’s a high-priority feature, and we’re
          planning to roll it out soon
        </p>
      </div>
      <GroupExtraction />
    </div>
  );
}
