"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

enum VoteOption {
  AGREE = 0,
  DISAGREE = 1,
  ABSTAIN = 2,
  FOLLOW_MAJORITY = 3,
}

const VoteOptionLabels = {
  [VoteOption.AGREE]: { label: "同意", color: "text-green-600", bg: "bg-green-50" },
  [VoteOption.DISAGREE]: { label: "反对", color: "text-red-600", bg: "bg-red-50" },
  [VoteOption.ABSTAIN]: { label: "弃权", color: "text-gray-600", bg: "bg-gray-50" },
  [VoteOption.FOLLOW_MAJORITY]: { label: "随多数", color: "text-blue-600", bg: "bg-blue-50" },
};

const Vote: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<VoteOption | null>(null);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 获取提案总数
  const { data: totalProposals } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "getProposalCount",
  });

  // 获取提案详情
  const { data: proposalData } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "getProposal",
    args: selectedProposal !== null ? [BigInt(selectedProposal)] : undefined,
  });

  // 检查是否在白名单中
  const { data: isWhitelisted } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "isWhitelisted",
    args: selectedProposal !== null && connectedAddress ? [BigInt(selectedProposal), connectedAddress] : undefined,
  });

  // 检查是否已投票
  const { data: hasVoted } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "hasVoted",
    args: selectedProposal !== null && connectedAddress ? [BigInt(selectedProposal), connectedAddress] : undefined,
  });

  // 获取用户投票选择
  const { data: userVoteChoice } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "getVoterChoice",
    args: selectedProposal !== null && connectedAddress ? [BigInt(selectedProposal), connectedAddress] : undefined,
  });

  const { writeContractAsync: writeVoteAsync } = useScaffoldWriteContract({
    contractName: "Vote",
  });

  // 获取活跃提案列表
  const getActiveProposals = () => {
    if (!totalProposals) return [];
    const proposals = [];
    for (let i = 0; i < Number(totalProposals); i++) {
      proposals.push(i);
    }
    return proposals;
  };

  const handleVote = async () => {
    if (selectedProposal === null || selectedOption === null) {
      alert("请选择提案和投票选项");
      return;
    }

    if (!isWhitelisted) {
      alert("您不在此提案的投票白名单中");
      return;
    }

    if (hasVoted) {
      alert("您已经投过票了");
      return;
    }

    setIsLoading(true);
    try {
      await writeVoteAsync({
        functionName: "vote",
        args: [BigInt(selectedProposal), selectedOption, comment],
      });

      alert("投票成功！");
      setSelectedOption(null);
      setComment("");
    } catch (error) {
      console.error("投票失败:", error);
      alert("投票失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString("zh-CN");
  };

  const isProposalActive = (endTime: bigint) => {
    return Date.now() < Number(endTime) * 1000;
  };

  if (!connectedAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先连接钱包</h1>
          <p>需要连接钱包才能参与投票</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full max-w-4xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">参与投票</span>
          <span className="block text-lg mt-2 text-gray-600">选择提案并进行投票</span>
        </h1>

        {/* 提案选择 */}
        <div className="bg-base-100 rounded-3xl shadow-md px-8 py-8 mb-6">
          <h2 className="text-2xl font-semibold mb-4">选择提案</h2>

          {totalProposals && Number(totalProposals) > 0 ? (
            <div className="grid gap-4">
              {getActiveProposals().map(proposalId => (
                <ProposalCard
                  key={proposalId}
                  proposalId={proposalId}
                  isSelected={selectedProposal === proposalId}
                  onSelect={() => setSelectedProposal(proposalId)}
                  connectedAddress={connectedAddress}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无可投票的提案</p>
            </div>
          )}
        </div>

        {/* 投票界面 */}
        {selectedProposal !== null && proposalData && (
          <div className="bg-base-100 rounded-3xl shadow-md px-8 py-8">
            <h2 className="text-2xl font-semibold mb-4">提案详情</h2>

            {/* 提案信息 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">{proposalData[1]}</h3>
              <p className="text-gray-700 mb-4">{proposalData[2]}</p>

              {proposalData[3] && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">主要变更内容：</h4>
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <p className="text-blue-800">{proposalData[3]}</p>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>
                  创建者: <Address address={proposalData[4]} />
                </p>
                <p>开始时间: {formatTimestamp(proposalData[5])}</p>
                <p>结束时间: {formatTimestamp(proposalData[6])}</p>
                <p>状态: {isProposalActive(proposalData[6]) ? "进行中" : "已结束"}</p>
              </div>
            </div>

            {/* 投票状态检查 */}
            {!isWhitelisted ? (
              <div className="alert alert-warning mb-4">
                <span>您不在此提案的投票白名单中，无法参与投票</span>
              </div>
            ) : hasVoted ? (
              <div className="alert alert-info mb-4">
                <span>您已投票，选择: {VoteOptionLabels[userVoteChoice as VoteOption]?.label}</span>
              </div>
            ) : !isProposalActive(proposalData[6]) ? (
              <div className="alert alert-error mb-4">
                <span>此提案投票已结束</span>
              </div>
            ) : (
              <>
                {/* 投票选项 */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-4">选择您的投票</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(VoteOptionLabels).map(([option, { label, color, bg }]) => (
                      <button
                        key={option}
                        onClick={() => setSelectedOption(Number(option) as VoteOption)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedOption === Number(option)
                            ? "border-primary bg-primary/10"
                            : `border-gray-200 ${bg} hover:border-gray-300`
                        }`}
                      >
                        <div className={`font-medium ${color}`}>{label}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {option === "0" && "支持该提案"}
                          {option === "1" && "反对该提案"}
                          {option === "2" && "不参与表决"}
                          {option === "3" && "跟随多数结果"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 建议留言 */}
                <div className="mb-6">
                  <label className="label">
                    <span className="label-text font-medium">投票建议（可选）</span>
                  </label>
                  <textarea
                    placeholder="您可以在此留下投票建议或意见"
                    className="textarea textarea-bordered w-full h-24"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                </div>

                {/* 投票按钮 */}
                <div className="flex justify-center">
                  <button
                    onClick={handleVote}
                    disabled={isLoading || selectedOption === null}
                    className="btn btn-primary btn-lg px-8"
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        投票中...
                      </>
                    ) : (
                      "确认投票"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 提案卡片组件
const ProposalCard = ({
  proposalId,
  isSelected,
  onSelect,
  connectedAddress,
}: {
  proposalId: number;
  isSelected: boolean;
  onSelect: () => void;
  connectedAddress: string;
}) => {
  const { data: proposalData } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "getProposal",
    args: [BigInt(proposalId)],
  });

  const { data: isWhitelisted } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "isWhitelisted",
    args: [BigInt(proposalId), connectedAddress],
  });

  const { data: hasVoted } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "hasVoted",
    args: [BigInt(proposalId), connectedAddress],
  });

  if (!proposalData) return null;

  const isActive = Date.now() < Number(proposalData[6]) * 1000;
  // const canVote = isWhitelisted && !hasVoted && isActive;

  return (
    <div
      onClick={onSelect}
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
        isSelected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">
          #{proposalId + 1} {proposalData[1]}
        </h3>
        <div className="flex gap-2">
          {hasVoted && <span className="badge badge-info">已投票</span>}
          {isWhitelisted ? (
            <span className="badge badge-success">可投票</span>
          ) : (
            <span className="badge badge-warning">非白名单</span>
          )}
          <span className={`badge ${isActive ? "badge-primary" : "badge-neutral"}`}>
            {isActive ? "进行中" : "已结束"}
          </span>
        </div>
      </div>
      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{proposalData[2]}</p>
      <div className="text-xs text-gray-500">
        结束时间: {new Date(Number(proposalData[6]) * 1000).toLocaleString("zh-CN")}
      </div>
    </div>
  );
};

export default Vote;
