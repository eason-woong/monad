"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const CreateProposal: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [diffContent, setDiffContent] = useState("");
  const [duration, setDuration] = useState("7"); // 默认7天
  const [whitelist, setWhitelist] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);

  // 检查是否为业委会成员
  // const { data: isCommitteeMember } = useScaffoldReadContract({
  //   contractName: "Vote",
  //   functionName: "isCommitteeMember",
  //   args: [connectedAddress],
  // });

  const { writeContractAsync: writeVoteAsync } = useScaffoldWriteContract({
    contractName: "Vote",
  });

  const addWhitelistAddress = () => {
    setWhitelist([...whitelist, ""]);
  };

  const removeWhitelistAddress = (index: number) => {
    setWhitelist(whitelist.filter((_, i) => i !== index));
  };

  const updateWhitelistAddress = (index: number, address: string) => {
    const newWhitelist = [...whitelist];
    newWhitelist[index] = address;
    setWhitelist(newWhitelist);
  };

  const handleCreateProposal = async () => {
    if (!title || !content || !diffContent) {
      alert("请填写完整信息");
      return;
    }

    // if (!isCommitteeMember) {
    //   alert("只有业委会成员可以创建提案");
    //   return;
    // }

    const validAddresses = whitelist.filter(addr => addr && addr.length === 42);
    if (validAddresses.length === 0) {
      alert("请至少添加一个有效的白名单地址");
      return;
    }

    setIsLoading(true);
    try {
      const durationInSeconds = parseInt(duration) * 24 * 60 * 60; // 转换为秒

      await writeVoteAsync({
        functionName: "createProposal",
        args: [title, content, diffContent, BigInt(durationInSeconds), validAddresses],
      });

      // 重置表单
      setTitle("");
      setContent("");
      setDiffContent("");
      setDuration("7");
      setWhitelist([""]);

      alert("提案创建成功！");
    } catch (error) {
      console.error("创建提案失败:", error);
      alert("创建提案失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  if (!connectedAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先连接钱包</h1>
          <p>需要连接钱包才能创建提案</p>
        </div>
      </div>
    );
  }

  // if (isCommitteeMember === false) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-center">
  //         <h1 className="text-2xl font-bold mb-4">权限不足</h1>
  //         <p>只有业委会成员可以创建提案</p>
  //         <div className="mt-4">
  //           <Address address={connectedAddress} />
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">创建提案</span>
          <span className="block text-lg mt-2 text-gray-600">业委会提案配置生成表单</span>
        </h1>

        <div className="bg-base-100 rounded-3xl shadow-md px-8 py-8">
          {/* 基本信息 */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">提案信息</h2>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">提案标题</span>
              </label>
              <input
                type="text"
                placeholder="请输入提案标题"
                className="input input-bordered w-full"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">提案内容</span>
              </label>
              <textarea
                placeholder="请详细描述提案内容"
                className="textarea textarea-bordered h-32"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">变更对比内容</span>
                <span className="label-text-alt">用户友好的变更说明</span>
              </label>
              <textarea
                placeholder="请描述具体的变更点，避免用户阅读整个文件"
                className="textarea textarea-bordered h-24"
                value={diffContent}
                onChange={e => setDiffContent(e.target.value)}
              />
            </div>

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-medium">投票持续时间（天）</span>
              </label>
              <input
                type="number"
                placeholder="7"
                className="input input-bordered w-full"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                min="1"
                max="30"
              />
            </div>
          </div>

          {/* 白名单配置 */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">投票白名单</h2>
            <p className="text-sm text-gray-600 mb-4">只有在白名单中的地址才能参与投票</p>

            {whitelist.map((address, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <div className="flex-1">
                  <AddressInput
                    placeholder="输入投票者地址"
                    value={address}
                    onChange={value => updateWhitelistAddress(index, value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeWhitelistAddress(index)}
                  className="btn btn-outline btn-error"
                  disabled={whitelist.length === 1}
                >
                  删除
                </button>
              </div>
            ))}

            <button type="button" onClick={addWhitelistAddress} className="btn btn-outline btn-primary mt-2">
              添加地址
            </button>
          </div>

          {/* 投票选项说明 */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">投票选项</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-800">同意</div>
                <div className="text-sm text-green-600">支持该提案</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="font-medium text-red-800">反对</div>
                <div className="text-sm text-red-600">反对该提案</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800">弃权</div>
                <div className="text-sm text-gray-600">不参与表决</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-800">随多数</div>
                <div className="text-sm text-blue-600">跟随多数结果</div>
              </div>
            </div>
          </div>

          {/* 创建按钮 */}
          <div className="flex justify-center">
            <button onClick={handleCreateProposal} disabled={isLoading} className="btn btn-primary btn-lg px-8">
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  创建中...
                </>
              ) : (
                "创建提案"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProposal;
