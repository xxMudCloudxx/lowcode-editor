import { useEffect } from "react";
import { useComponetsStore } from "../stores/components";

export function EditArea() {
  const { components, addComponent } = useComponetsStore();

  useEffect(() => {
    addComponent(
      {
        id: 222,
        name: "Container",
        props: {},
        children: [],
      },
      1
    );
  }, []);

  return (
    <div>
      <pre>{JSON.stringify(components, null, 2)}</pre>
    </div>
  );
}
