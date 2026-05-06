import { Drawer, Tabs } from "antd";
import { useExpressionStore } from "../../stores/expressionStore";
import { DataSourceList } from "./DataSourceList";
import { VariableList } from "./VariableList";

interface VariablePanelProps {
  open: boolean;
  onClose: () => void;
}

export function VariablePanel({ open, onClose }: VariablePanelProps) {
  const globalVariables = useExpressionStore((state) => state.globalVariables);
  const pageVariables = useExpressionStore((state) => state.pageVariables);
  const globalValues = useExpressionStore((state) => state.globalValues);
  const pageValues = useExpressionStore((state) => state.pageValues);
  const dataValues = useExpressionStore((state) => state.dataValues);
  const dataSources = useExpressionStore((state) => state.dataSources);
  const addVariable = useExpressionStore((state) => state.addVariable);
  const removeVariable = useExpressionStore((state) => state.removeVariable);
  const setGlobalVariable = useExpressionStore((state) => state.setGlobalVariable);
  const setPageVariable = useExpressionStore((state) => state.setPageVariable);
  const addDataSource = useExpressionStore((state) => state.addDataSource);
  const removeDataSource = useExpressionStore((state) => state.removeDataSource);
  const updateDataSource = useExpressionStore((state) => state.updateDataSource);
  const fetchDataSource = useExpressionStore((state) => state.fetchDataSource);

  return (
    <Drawer
      title="变量与数据源"
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
    >
      <Tabs
        items={[
          {
            key: "page",
            label: "页面变量",
            children: (
              <VariableList
                scope="page"
                definitions={pageVariables}
                values={pageValues}
                onAdd={(definition) => addVariable("page", definition)}
                onRemove={(name) => removeVariable("page", name)}
                onValueChange={setPageVariable}
              />
            ),
          },
          {
            key: "global",
            label: "全局变量",
            children: (
              <VariableList
                scope="global"
                definitions={globalVariables}
                values={globalValues}
                onAdd={(definition) => addVariable("global", definition)}
                onRemove={(name) => removeVariable("global", name)}
                onValueChange={setGlobalVariable}
              />
            ),
          },
          {
            key: "data",
            label: "数据源",
            children: (
              <DataSourceList
                dataSources={dataSources}
                dataValues={dataValues}
                onAdd={addDataSource}
                onRemove={removeDataSource}
                onUpdate={updateDataSource}
                onTest={fetchDataSource}
              />
            ),
          },
        ]}
      />
    </Drawer>
  );
}
