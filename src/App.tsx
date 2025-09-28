import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Layout,
  Typography,
  Form,
  Input,
  Button,
  Table,
  Space,
  Modal,
  Drawer,
  Tooltip,
  Popconfirm,
  notification,
  Tag,
  Select,
  Row,
  Col,
  Divider,
} from "antd";
import {
  PlusOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";

import type { ColumnsType } from "antd/es/table";

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// --- Types ---
type RecordItem = {
  id: string;
  label?: string;
  value: number;
  createdAt: string;
};

type CommandRun = {
  id: string;
  recordId: string | null;
  command: string;
  output: string;
  startedAt: string;
};

// --- Utility functions ---
const uid = (prefix = "r") =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

// The algorithm from your #1: check if n can be represented as product of two ints > 1
function isCompositeProduct(n: number): {
  result: boolean;
  explanation: string;
} {
  if (!Number.isInteger(n) || n <= 3) {
    return {
      result: false,
      explanation:
        "Must be an integer greater than 3 (smallest product is 2*2).",
    };
  }
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) {
      const other = n / i;
      return {
        result: true,
        explanation: `${n} = ${i} × ${other}`,
      };
    }
  }
  return {
    result: false,
    explanation: `${n} is prime — it cannot be expressed as product of two integers > 1.`,
  };
}

// LocalStorage keys
const LS_RECORDS = "app_records_v1";
const LS_COMMANDS = "app_cmds_v1";

// --- Main App ---
export default function App(): JSX.Element {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<RecordItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_RECORDS);
      return raw ? (JSON.parse(raw) as RecordItem[]) : [];
    } catch {
      return [];
    }
  });
  const [commands, setCommands] = useState<CommandRun[]>(() => {
    try {
      const raw = localStorage.getItem(LS_COMMANDS);
      return raw ? (JSON.parse(raw) as CommandRun[]) : [];
    } catch {
      return [];
    }
  });

  const [query, setQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_RECORDS, JSON.stringify(records));
  }, [records]);
  useEffect(() => {
    localStorage.setItem(LS_COMMANDS, JSON.stringify(commands));
  }, [commands]);

  // Derived filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      return (
        r.label?.toLowerCase().includes(q) ||
        String(r.value).includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [query, records]);

  // Create record
  const handleCreate = async (values: { label?: string; value: number }) => {
    const num = Number(values.value);
    if (!Number.isInteger(num)) {
      notification.error({ message: "Value must be an integer" });
      return;
    }
    const item: RecordItem = {
      id: uid("rec"),
      label: values.label?.trim() || undefined,
      value: num,
      createdAt: new Date().toISOString(),
    };
    setRecords((s) => [item, ...s]);
    form.resetFields();
    notification.success({
      message: "Record created",
      description: `ID: ${item.id}`,
    });
  };

  // Delete record
  const handleDelete = (id: string) => {
    setRecords((s) => s.filter((r) => r.id !== id));
    // remove related command history optionally
    setCommands((s) => s.filter((c) => c.recordId !== id));
    notification.info({ message: "Record deleted", description: id });
  };

  // Run command — we simulate execution locally by calling the algorithm
  const runCommand = (opts: { recordId?: string | null; command: string }) => {
    const id = uid("cmd");
    const started = new Date().toISOString();
    let output = "";
    if (opts.command === "check" && opts.recordId) {
      const rec = records.find((r) => r.id === opts.recordId);
      if (!rec) output = "Record not found (it may have been deleted).";
      else {
        const res = isCompositeProduct(rec.value);
        output = `${res.result ? "YES" : "NO"}: ${res.explanation}`;
      }
    } else if (opts.command === "check:all") {
      output = records
        .map((r) => {
          const res = isCompositeProduct(r.value);
          return `${r.id} (${r.value}) → ${res.result ? "YES" : "NO"}: ${
            res.explanation
          }`;
        })
        .join("\n\n");
    } else {
      output = `Unknown command: ${opts.command}`;
    }

    const cmd: CommandRun = {
      id,
      recordId: opts.recordId ?? null,
      command: opts.command,
      output,
      startedAt: started,
    };
    setCommands((s) => [cmd, ...s].slice(0, 200));
    // open drawer to show output
    setSelectedRecord(records.find((r) => r.id === opts.recordId) ?? null);
    setDrawerOpen(true);
  };

  // Table columns
  const columns: ColumnsType<RecordItem> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <Text code aria-label={`record-id-${id}`}>
          {id}
        </Text>
      ),
      width: 170,
    },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      render: (lab) => lab ?? <Text type="secondary">—</Text>,
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      sorter: (a, b) => a.value - b.value,
      render: (v) => <Tag>{v}</Tag>,
      width: 120,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (ts) => new Date(ts).toLocaleString(),
      width: 180,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Tooltip title="Run check on this number">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() =>
                runCommand({ recordId: record.id, command: "check" })
              }
              aria-label={`run-check-${record.id}`}
            >
              Check
            </Button>
          </Tooltip>
          <Popconfirm
            title={`Delete record ${record.id}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              aria-label={`delete-${record.id}`}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 260,
    },
  ];

  // Accessibility: move focus to output when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      setTimeout(() => outputRef.current?.focus(), 200);
    }
  }, [drawerOpen]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#fff" }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center">
              <Title level={4} style={{ margin: 0 }}>
                Number Checker — Frontend
              </Title>
              <Text type="secondary">
                (check if n = a × b for integers &gt; 1)
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<FileSearchOutlined />}
                onClick={() =>
                  runCommand({ command: "check:all", recordId: null })
                }
                aria-label="run-check-all"
              >
                Check all
              </Button>
              <Button
                type="default"
                onClick={() => {
                  // export
                  const blob = new Blob([JSON.stringify(records, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `records_${new Date().toISOString()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Header>

      <Content style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8} lg={6}>
            <section aria-labelledby="create-record-heading">
              <Title level={5} id="create-record-heading">
                Create record
              </Title>
              <Form form={form} layout="vertical" onFinish={handleCreate}>
                <Form.Item label="Label (optional)" name="label">
                  <Input placeholder="E.g. sample-1" aria-label="label-input" />
                </Form.Item>
                <Form.Item
                  label="Integer value"
                  name="value"
                  rules={[
                    {
                      required: true,
                      message: "Please enter an integer value",
                    },
                  ]}
                >
                  <Input
                    placeholder="Enter integer e.g. 12"
                    aria-label="value-input"
                    onKeyDown={(e) => {
                      // submit on Enter
                      if (e.key === "Enter") {
                        form.submit();
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button
                      htmlType="submit"
                      type="primary"
                      icon={<PlusOutlined />}
                    >
                      Create
                    </Button>
                    <Button
                      htmlType="button"
                      onClick={() => form.resetFields()}
                    >
                      Reset
                    </Button>
                  </Space>
                </Form.Item>
              </Form>

              <Divider />

              <div aria-live="polite">
                <Text type="secondary">Quick tips:</Text>
                <ul>
                  <li>
                    Enter an integer &gt; 1 (smallest product is 2 × 2 = 4).
                  </li>
                  <li>
                    Use <code>Check</code> to run the command on one record, or{" "}
                    <code>Check all</code>.
                  </li>
                </ul>
              </div>
            </section>
          </Col>

          <Col xs={24} md={16} lg={18}>
            <Row justify="space-between" align="middle">
              <Col span={16}>
                <Input
                  placeholder="Search by label, id or value"
                  prefix={<SearchOutlined />}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  allowClear
                  aria-label="search-box"
                />
              </Col>
              <Col>
                <Space>
                  <Text strong>{filtered.length}</Text>
                  <Text type="secondary">records shown</Text>
                </Space>
              </Col>
            </Row>

            <div style={{ marginTop: 12 }}>
              <Table
                columns={columns}
                dataSource={filtered}
                rowKey={(r) => r.id}
                pagination={{ pageSize: 8 }}
                locale={{
                  emptyText: "No records yet — create one to get started",
                }}
                aria-label="records-table"
              />
            </div>

            <Divider />

            <section aria-labelledby="commands-heading">
              <Title level={5} id="commands-heading">
                Command history
              </Title>

              <div role="region" aria-live="polite">
                {commands.length === 0 ? (
                  <Text type="secondary">
                    No commands run yet. Run a check to see results here.
                  </Text>
                ) : (
                  <Table
                    dataSource={commands}
                    rowKey={(c) => c.id}
                    pagination={{ pageSize: 5 }}
                    columns={[
                      {
                        title: "When",
                        dataIndex: "startedAt",
                        key: "startedAt",
                        render: (t) => new Date(t).toLocaleString(),
                      },
                      {
                        title: "Command",
                        dataIndex: "command",
                        key: "command",
                      },
                      {
                        title: "Record",
                        dataIndex: "recordId",
                        key: "recordId",
                        render: (rid) =>
                          rid ? (
                            <Text code>{rid}</Text>
                          ) : (
                            <Text type="secondary">global</Text>
                          ),
                      },
                      {
                        title: "Output",
                        dataIndex: "output",
                        key: "output",
                        render: (out, rec: CommandRun) => (
                          <Button
                            onClick={() => {
                              // open drawer and set the selected command
                              setDrawerOpen(true);
                              setSelectedRecord(
                                records.find((r) => r.id === rec.recordId) ??
                                  null
                              );
                              // put output as a temporary command shown first
                              setCommands((s) => [
                                rec,
                                ...s.filter((x) => x.id !== rec.id),
                              ]);
                            }}
                          >
                            View output
                          </Button>
                        ),
                      },
                      {
                        title: "",
                        key: "del",
                        render: (_, rec) => (
                          <Popconfirm
                            title="Delete command log?"
                            onConfirm={() =>
                              setCommands((s) =>
                                s.filter((c) => c.id !== rec.id)
                              )
                            }
                          >
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              aria-label={`delete-cmd-${rec.id}`}
                            />
                          </Popconfirm>
                        ),
                      },
                    ]}
                  />
                )}
              </div>
            </section>
          </Col>
        </Row>

        <Drawer
          title={selectedRecord ? `Output — ${selectedRecord.id}` : "Output"}
          placement="right"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={560}
          aria-labelledby="output-drawer-heading"
        >
          <div tabIndex={-1} ref={outputRef} style={{ outline: "none" }}>
            <h3 id="output-drawer-heading">Latest run</h3>
            {commands.length > 0 ? (
              <div
                style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                aria-live="polite"
              >
                {commands[0].output}
              </div>
            ) : (
              <Text type="secondary">No output</Text>
            )}

            <Divider />

            <Button onClick={() => setDrawerOpen(false)}>Close</Button>
          </div>
        </Drawer>
      </Content>
    </Layout>
  );
}
