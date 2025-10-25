import PlanForm from "./client";

const NewPlanPage = async () => {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Create Plan</h1>
        <p className="text-muted-foreground">Fill in the details below to create a new plan.</p>
      </div>
      <PlanForm />
    </div>
  );
};

export default NewPlanPage;
