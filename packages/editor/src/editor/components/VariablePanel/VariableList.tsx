import { useState } from "react";
import { Button, Card, Input, Space, Typography } from "antd";
import type { VariableDefinition } from "@lowcode/schema";

interface VariableListProps {
  scope: "global" | "page";
  definitions: VariableDefinition[];
  values: Record<string, unknown>;
  onAdd: (definition: VariableDefinition) => void;
  onRemove: (name: string) => void;
  onValueChange: (name: string, value: unknown) => void;
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function parseLooseValue(input: string): unknown {
  const trimmed = input.trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (!Number.isNaN(Number(trimmed)) && trimmed !== "") {
    return Number(trimmed);
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return input;
  }
}

export function VariableList({
  scope,
  definitions,
  values,
  onAdd,
  onRemove,
  onValueChange,
}: VariableListProps) {
  const prefix = scope === "global" ? "$global" : "$page";

  return (
    <div className="flex flex-col gap-3">
      <VariableCreator onAdd={onAdd} />

      {definitions.length === 0 ? (
        <Typography.Text type="secondary">
          暂无变量，先新增一个变量再去属性面板里绑定它。
        </Typography.Text>
      ) : (
        definitions.map((definition) => (
          <Card
            key={`${scope}-${definition.name}`}
            size="small"
            title={
              <div className="flex items-center justify-between gap-3">
                <span>{`${prefix}.${definition.name}`}</span>
                <Button danger type="text" onClick={() => onRemove(definition.name)}>
                  删除
                </Button>
              </div>
            }
          >
            <Space direction="vertical" className="w-full" size="small">
              <div>
                <Typography.Text type="secondary">默认值</Typography.Text>
                <Input value={stringifyValue(definition.defaultValue)} disabled />
              </div>

              <div>
                <Typography.Text type="secondary">当前值</Typography.Text>
                <Input
                  value={stringifyValue(values[definition.name])}
                  onChange={(event) =>
                    onValueChange(
                      definition.name,
                      parseLooseValue(event.target.value),
                    )
                  }
                />
              </div>

              <div>
                <Typography.Text type="secondary">描述</Typography.Text>
                <Input value={definition.description ?? ""} disabled />
              </div>
            </Space>
          </Card>
        ))
      )}
    </div>
  );
}

function VariableCreator({
  onAdd,
}: {
  onAdd: (definition: VariableDefinition) => void;
}) {
  return (
    <Card size="small" title="新增变量">
      <VariableCreatorInner onAdd={onAdd} />
    </Card>
  );
}

function VariableCreatorInner({
  onAdd,
}: {
  onAdd: (definition: VariableDefinition) => void;
}) {
  const [name, setName] = useState("");
  const [defaultValue, setDefaultValue] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onAdd({
      name: trimmedName,
      defaultValue: parseLooseValue(defaultValue),
      description: description.trim() || undefined,
    });

    setName("");
    setDefaultValue("");
    setDescription("");
  };

  return (
    <Space direction="vertical" className="w-full" size="small">
      <Input
        placeholder="变量名，例如 count"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Input
        placeholder="默认值，例如 0 / true / hello"
        value={defaultValue}
        onChange={(event) => setDefaultValue(event.target.value)}
      />
      <Input
        placeholder="描述（可选）"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Button type="primary" onClick={handleAdd}>
        添加变量
      </Button>
    </Space>
  );
}
