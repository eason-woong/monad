"use client";

import { useState } from "react";
import type { NextPage } from "next";
// import { useAccount } from "wagmi";
import { ChartBarIcon, ClockIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

enum VoteOption {
  AGREE = 0,
  DISAGREE = 1,
  ABSTAIN = 2,
  FOLLOW_MAJORITY = 3,
}

const VoteOptionLabels = {
  [VoteOption.AGREE]: { label: "同意", color: "text-green-600", bg: "bg-green-100" },
  [VoteOption.DISAGREE]: { label: "反对", color: "text-red-600", bg: "bg-red-100" },
  [VoteOption.ABSTAIN]: { label: "弃权", color: "text-gray-600", bg: "bg-gray-100" },
  [VoteOption.FOLLOW_MAJORITY]: { label: "随多数", color: "text-blue-600", bg: "bg-blue-100" },
};

const Results: NextPage = () => {
  // const { address: connectedAddress } = useAccount();
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);

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

  // 获取提案投票统计
  const { data: voteStats } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "getProposalVoteStats",
    args: selectedProposal !== null ? [BigInt(selectedProposal)] : undefined,
  });

  // 获取所有投票者
  const { data: voters } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "getProposalVoters",
    args: selectedProposal !== null ? [BigInt(selectedProposal)] : undefined,
  });

  // 获取提案列表
  const getProposals = () => {
    if (!totalProposals) return [];
    const proposals = [];
    for (let i = 0; i < Number(totalProposals); i++) {
      proposals.push(i);
    }
    return proposals;
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString("zh-CN");
  };

  const isProposalActive = (endTime: bigint) => {
    return Date.now() < Number(endTime) * 1000;
  };

  // 计算投票百分比
  const calculatePercentage = (count: bigint, total: bigint) => {
    if (total === 0n) return 0;
    return Number((count * 100n) / total);
  };

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full max-w-6xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">投票结果统计</span>
          <span className="block text-lg mt-2 text-gray-600">查看提案投票数据和统计分析</span>
        </h1>

        {/* 提案选择 */}
        <div className="bg-base-100 rounded-3xl shadow-md px-8 py-8 mb-6">
          <h2 className="text-2xl font-semibold mb-4">选择提案</h2>

          {totalProposals && Number(totalProposals) > 0 ? (
            <div className="grid gap-4">
              {getProposals().map(proposalId => (
                <ProposalResultCard
                  key={proposalId}
                  proposalId={proposalId}
                  isSelected={selectedProposal === proposalId}
                  onSelect={() => setSelectedProposal(proposalId)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">暂无提案</p>
            </div>
          )}
        </div>

        {/* 详细统计 */}
        {selectedProposal !== null && proposalData && voteStats && (
          <div className="grid gap-6">
            {/* 提案基本信息 */}
            <div className="bg-base-100 rounded-3xl shadow-md px-8 py-8">
              <h2 className="text-2xl font-semibold mb-4">提案信息</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
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
                </div>

                <div className="space-y-4">
                  <div className="stat">
                    <div className="stat-figure text-primary">
                      <UsersIcon className="w-8 h-8" />
                    </div>
                    <div className="stat-title">总投票数</div>
                    <div className="stat-value text-primary">{Number(proposalData[8])}</div>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      创建者: <Address address={proposalData[4]} />
                    </p>
                    <p>开始时间: {formatTimestamp(proposalData[5])}</p>
                    <p>结束时间: {formatTimestamp(proposalData[6])}</p>
                    <p className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      状态:
                      <span
                        className={`badge ${isProposalActive(proposalData[6]) ? "badge-primary" : "badge-neutral"}`}
                      >
                        {isProposalActive(proposalData[6]) ? "进行中" : "已结束"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 投票统计图表 */}
            <div className="bg-base-100 rounded-3xl shadow-md px-8 py-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6" />
                投票统计
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* 投票分布 */}
                <div>
                  <h3 className="text-lg font-medium mb-4">投票分布</h3>
                  <div className="space-y-4">
                    {Object.entries(VoteOptionLabels).map(([option, { label, color, bg }]) => {
                      const count = voteStats[Number(option)];
                      const percentage = calculatePercentage(count, proposalData[8]);

                      return (
                        <div key={option} className="flex items-center gap-4">
                          <div className={`w-20 text-sm font-medium ${color}`}>{label}</div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{Number(count)} 票</span>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${bg.replace("bg-", "bg-").replace("-100", "-500")}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 投票率和关键数据 */}
                <div>
                  <h3 className="text-lg font-medium mb-4">关键数据</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="stat bg-gray-50 rounded-lg p-4">
                      <div className="stat-title text-xs">同意率</div>
                      <div className="stat-value text-2xl text-green-600">
                        {Number(proposalData[8]) > 0
                          ? calculatePercentage(voteStats[VoteOption.AGREE], proposalData[8]).toFixed(1)
                          : "0"}
                        %
                      </div>
                    </div>

                    <div className="stat bg-gray-50 rounded-lg p-4">
                      <div className="stat-title text-xs">反对率</div>
                      <div className="stat-value text-2xl text-red-600">
                        {Number(proposalData[8]) > 0
                          ? calculatePercentage(voteStats[VoteOption.DISAGREE], proposalData[8]).toFixed(1)
                          : "0"}
                        %
                      </div>
                    </div>

                    <div className="stat bg-gray-50 rounded-lg p-4">
                      <div className="stat-title text-xs">弃权率</div>
                      <div className="stat-value text-2xl text-gray-600">
                        {Number(proposalData[8]) > 0
                          ? calculatePercentage(voteStats[VoteOption.ABSTAIN], proposalData[8]).toFixed(1)
                          : "0"}
                        %
                      </div>
                    </div>

                    <div className="stat bg-gray-50 rounded-lg p-4">
                      <div className="stat-title text-xs">随多数</div>
                      <div className="stat-value text-2xl text-blue-600">
                        {Number(proposalData[8]) > 0
                          ? calculatePercentage(voteStats[VoteOption.FOLLOW_MAJORITY], proposalData[8]).toFixed(1)
                          : "0"}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 投票者明细 */}
            {voters && voters.length > 0 && (
              <div className="bg-base-100 rounded-3xl shadow-md px-8 py-8">
                <h2 className="text-2xl font-semibold mb-4">投票者明细</h2>
                <p className="text-sm text-gray-600 mb-4">透明的投票记录，所有投票数据公开可查</p>

                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>投票者地址</th>
                        <th>投票选择</th>
                        <th>投票时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voters.map((voterAddress, index) => (
                        <VoterRow
                          key={index}
                          index={index + 1}
                          voterAddress={voterAddress}
                          proposalId={selectedProposal}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 提案结果卡片组件
const ProposalResultCard = ({
  proposalId,
  isSelected,
  onSelect,
}: {
  proposalId: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const { data: proposalData } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "getProposal",
    args: [BigInt(proposalId)],
  });

  const { data: voteStats } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "getProposalVoteStats",
    args: [BigInt(proposalId)],
  });

  if (!proposalData || !voteStats) return null;

  const isActive = Date.now() < Number(proposalData[6]) * 1000;
  const totalVotes = Number(proposalData[8]);
  const agreePercentage = totalVotes > 0 ? Number((voteStats[0] * 100n) / BigInt(totalVotes)) : 0;

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
          <span className="badge badge-neutral">{totalVotes} 票</span>
          <span className={`badge ${isActive ? "badge-primary" : "badge-success"}`}>
            {isActive ? "进行中" : "已结束"}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{proposalData[2]}</p>

      {/* 简单的投票结果预览 */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-green-600">同意: {agreePercentage.toFixed(1)}%</span>
          <div className="w-16 bg-gray-200 rounded-full h-1">
            <div className="h-1 bg-green-500 rounded-full" style={{ width: `${agreePercentage}%` }}></div>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          结束: {new Date(Number(proposalData[6]) * 1000).toLocaleDateString("zh-CN")}
        </div>
      </div>
    </div>
  );
};

// 投票者行组件
const VoterRow = ({ index, voterAddress, proposalId }: { index: number; voterAddress: string; proposalId: number }) => {
  const { data: voterChoice } = useScaffoldReadContract({
    contractName: "Vote",
    functionName: "getVoterChoice",
    args: [BigInt(proposalId), voterAddress],
  });

  return (
    <tr>
      <td>{index}</td>
      <td>
        <Address address={voterAddress} />
      </td>
      <td>
        {voterChoice !== undefined && (
          <span className={`badge ${VoteOptionLabels[voterChoice as VoteOption]?.bg}`}>
            {VoteOptionLabels[voterChoice as VoteOption]?.label}
          </span>
        )}
      </td>
      <td>
        <span className="text-sm text-gray-500">链上记录</span>
      </td>
    </tr>
  );
};

export default Results;
