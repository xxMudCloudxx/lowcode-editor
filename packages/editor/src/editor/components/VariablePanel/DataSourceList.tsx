import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import type { DataSourceConfig } from "@lowcode/schema";

interface DataSourceListProps {
  dataSources: DataSourceConfig[];
  dataValues: Record<string, unknown>;
  onAdd: (config: DataSourceConfig) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, config: Partial<DataSourceConfig>) => void;
  onTest: (id: string) => Promise<void>;
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function DataSourceList({
  dataSources,
  dataValues,
  onAdd,
  onRemove,
  onUpdate,
  onTest,
}: DataSourceListProps) {
  return (
    <div className="flex flex-col gap-3">
      <DataSourceCreator onAdd={onAdd} />

      {dataSources.length === 0 ? (
        <Typography.Text type="secondary">
          暂无数据源，可以先配置一个接口，再在表达式里使用 `$data.xxx`。
        </Typography.Text>
      ) : (
        dataSources.map((dataSource) => (
          <Card
            key={dataSource.id}
            size="small"
            title={
              <div className="flex items-center justify-between gap-3">
                <span>{`$data.${dataSource.name}`}</span>
                <Button danger type="text" onClick={() => onRemove(dataSource.id)}>
                  删除
                </Button>
              </div>
            }
          >
            <Space direction="vertical" className="w-full" size="small">
              <div>
                <Typography.Text type="secondary">名称</Typography.Text>
                <Input
                  value={dataSource.name}
                  onChange={(event) =>
                    onUpdate(dataSource.id, { name: event.target.value })
                  }
                />
              </div>
              <div>
                <Typography.Text type="secondary">URL</Typography.Text>
                <Input
                  value={dataSource.url}
                  onChange={(event) =>
                    onUpdate(dataSource.id, { url: event.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  className="w-28"
                  value={dataSource.method}
                  options={[
                    { label: "GET", value: "GET" },
                    { label: "POST", value: "POST" },
                  ]}
                  onChange={(value) =>
                    onUpdate(dataSource.id, { method: value as "GET" | "POST" })
                  }
                />
                <span className="text-sm text-neutral-500">自动请求</span>
                <Switch
                  checked={dataSource.autoFetch ?? false}
                  onChange={(checked) =>
                    onUpdate(dataSource.id, { autoFetch: checked })
                  }
                />
                <Button onClick={() => void onTest(dataSource.id)}>测试请求</Button>
              </div>

              {dataValues[dataSource.name] !== undefined && (
                <Alert
                  type="info"
                  showIcon
                  message="最近一次返回结果"
                  description={
                    <pre className="whitespace-pre-wrap break-all text-xs mb-0">
                      {stringifyValue(dataValues[dataSource.name])}
                    </pre>
                  }
                />
              )}
            </Space>
          </Card>
        ))
      )}
    </div>
  );
}

function DataSourceCreator({
  onAdd,
}: {
  onAdd: (config: DataSourceConfig) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [autoFetch, setAutoFetch] = useState(true);

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName || !trimmedUrl) return;

    onAdd({
      id: `${trimmedName}-${Date.now()}`,
      name: trimmedName,
      url: trimmedUrl,
      method,
      autoFetch,
    });

    setName("");
    setUrl("");
    setMethod("GET");
    setAutoFetch(true);
  };

  return (
    <Card size="small" title="新增数据源">
      <Space direction="vertical" className="w-full" size="small">
        <Input
          placeholder="数据源名称，例如 mockApi"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          placeholder="接口地址，例如 https://example.com/api"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <div className="flex items-center gap-2">
          <Select
            className="w-28"
            value={method}
            options={[
              { label: "GET", value: "GET" },
              { label: "POST", value: "POST" },
            ]}
            onChange={(value) => setMethod(value as "GET" | "POST")}
          />
          <span className="text-sm text-neutral-500">自动请求</span>
          <Switch checked={autoFetch} onChange={setAutoFetch} />
        </div>
        <Button type="primary" onClick={handleAdd}>
          添加数据源
        </Button>
      </Space>
    </Card>
  );
}
