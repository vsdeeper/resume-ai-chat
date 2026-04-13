"use client";

import {
  AntDesignOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ProfileOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Bubble,
  type BubbleItemType,
  Conversations,
  Prompts,
  Sender,
  Suggestion,
  ThoughtChain,
  XProvider,
} from "@ant-design/x";
import { Avatar, Card, Divider, Flex, Skeleton } from "antd";
import { useState, useEffect } from "react";

import { useRef } from "react";

export default function Home() {
  const idRef = useRef(0);
  const getKey = () => `bubble_${idRef.current++}`;
  const [value, setValue] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<BubbleItemType[]>([
    {
      key: getKey(),
      role: "ai",
      content: "基于本地知识库的信息检索，您想问什么呢？",
    },
  ]);

  useEffect(() => {
    const initKnowledgeBase = async () => {
      try {
        const res = await fetch("/api/ingest");
        await res.json();
      } catch (error) {
        console.error("初始化知识库失败:", error);
      } finally {
        setInitializing(false);
      }
    };

    initKnowledgeBase();
  }, []);

  const updateMessages = async (userMessage: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: "",
          loading: true,
          typing: true,
        };
        return newMessages;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullText,
            loading: false,
            typing: true,
          };
          return newMessages;
        });
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: fullText,
          loading: false,
          typing: true,
        };
        return newMessages;
      });
    } catch (error) {
      console.error("发送消息失败:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: "AI请求失败，请重试",
          loading: false,
          typing: true,
        };
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!value.trim()) return;

    const userMessage = value.trim();
    setMessages((prev) => [
      ...prev,
      {
        key: getKey(),
        role: "user",
        content: userMessage,
      },
      {
        key: getKey(),
        role: "ai",
        content: "",
        loading: true,
      },
    ]);
    setValue("");
    updateMessages(userMessage);
  };

  return (
    <>
      <Flex flex={1} gap={12} vertical style={{ padding: 30 }}>
        <Card
          style={{ display: "flex", flex: 1 }}
          styles={{ body: { display: "flex", flex: 1 } }}
        >
          <XProvider>
            <Flex gap={12} flex={1}>
              <Conversations
                style={{ width: 200 }}
                defaultActiveKey="1"
                items={[
                  {
                    key: "1",
                    label: "简历信息库",
                    icon: <ProfileOutlined />,
                  },
                ]}
              />
              <Divider orientation="vertical" style={{ height: "auto" }} />
              <Flex vertical justify="space-between" style={{ flex: 1 }}>
                {initializing ? (
                  <div style={{ width: "100%" }}>
                    <Skeleton active paragraph={{ rows: 8 }} />
                  </div>
                ) : (
                  <>
                    <Bubble.List
                      role={{
                        ai: () => ({
                          typing: true,
                          header: "AI",
                          avatar: () => <Avatar icon={<AntDesignOutlined />} />,
                        }),
                        user: (data) => ({
                          placement: "end",
                          typing: false,
                          header: `User-${data.key}`,
                          avatar: () => <Avatar icon={<UserOutlined />} />,
                        }),
                      }}
                      items={messages}
                      style={{ height: "calc(100vh - 250px)" }}
                    />
                    <Flex vertical gap={12}>
                      <Prompts
                        items={[
                          {
                            key: "1",
                            label: "工作几年了？",
                            icon: <BulbOutlined style={{ color: "#FFD700" }} />,
                            disabled: loading,
                          },
                          {
                            key: "2",
                            label: "工作了几家公司？",
                            icon: <BulbOutlined style={{ color: "#FFD700" }} />,
                            disabled: loading,
                          },
                        ]}
                        onItemClick={({ data }) => {
                          const userMessage = data.label as string;
                          setMessages((prev) => [
                            ...prev,
                            {
                              key: getKey(),
                              role: "user",
                              content: userMessage,
                            },
                            {
                              key: getKey(),
                              role: "ai",
                              content: "",
                              loading: true,
                            },
                          ]);
                          setValue("");
                          updateMessages(userMessage);
                        }}
                      />
                      <Suggestion
                        items={[
                          { label: "多少岁", value: "多少岁" },
                          { label: "教育背景", value: "教育背景" },
                          { label: "项目经历", value: "项目经历" },
                        ]}
                        onSelect={(value) => setValue(value)}
                        disabled={loading}
                      >
                        {({ onTrigger, onKeyDown }) => {
                          return (
                            <Sender
                              disabled={loading}
                              value={value}
                              onChange={(nextVal) => {
                                if (nextVal === "/") {
                                  onTrigger();
                                } else if (!nextVal) {
                                  onTrigger(false);
                                }
                                setValue(nextVal);
                              }}
                              onSubmit={handleSubmit}
                              onKeyDown={onKeyDown}
                              placeholder='输入 "/" 触发建议'
                            />
                          );
                        }}
                      </Suggestion>
                    </Flex>
                  </>
                )}
              </Flex>
              <Divider orientation="vertical" style={{ height: "auto" }} />
              <ThoughtChain
                style={{ width: 200 }}
                items={[
                  {
                    title: "初始化知识库",
                    status: initializing ? "loading" : "success",
                    description: initializing ? "初始化中..." : "已完成",
                    icon: initializing ? (
                      <LoadingOutlined />
                    ) : (
                      <CheckCircleOutlined />
                    ),
                  },
                ]}
              />
            </Flex>
          </XProvider>
        </Card>
      </Flex>
    </>
  );
}
