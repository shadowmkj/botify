import GroupExtraction from "@/components/group-extraction";

export default function GroupExtractionPage() {
    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">
                    Group Extraction
                </h2>
                <p className="text-muted-foreground">
                    Fetch groups and extract contacts from them.
                </p>
            </div>
            <GroupExtraction />
        </div>
    );
}
