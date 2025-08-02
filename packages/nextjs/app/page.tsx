"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  BugAntIcon,
  ChartBarIcon,
  DocumentPlusIcon,
  HandRaisedIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">欢迎使用</span>
            <span className="block text-4xl font-bold">社区投票系统</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">已连接地址:</p>
            <Address address={connectedAddress} />
          </div>

          <p className="text-center text-lg mb-4">基于区块链的去中心化社区提案投票平台</p>
          <p className="text-center text-gray-600">透明、公开、不可篡改的投票解决方案</p>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-8 flex-col md:flex-row flex-wrap">
            {/* 主要功能 */}
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <DocumentPlusIcon className="h-8 w-8 fill-secondary" />
              <h3 className="font-bold text-lg mb-2">创建提案</h3>
              <p className="mb-4">业委会成员可以创建新的投票提案，配置投票选项和白名单</p>
              <Link href="/create-proposal" passHref className="btn btn-primary btn-sm">
                创建提案
              </Link>
            </div>

            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <HandRaisedIcon className="h-8 w-8 fill-secondary" />
              <h3 className="font-bold text-lg mb-2">参与投票</h3>
              <p className="mb-4">查看活跃提案并参与投票，支持同意、反对、弃权、随多数选项</p>
              <Link href="/vote" passHref className="btn btn-primary btn-sm">
                参与投票
              </Link>
            </div>

            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <ChartBarIcon className="h-8 w-8 fill-secondary" />
              <h3 className="font-bold text-lg mb-2">投票统计</h3>
              <p className="mb-4">查看所有提案的投票结果和统计数据，透明可查</p>
              <Link href="/results" passHref className="btn btn-primary btn-sm">
                查看统计
              </Link>
            </div>

            {/* 开发工具 */}
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl opacity-75">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <h3 className="font-bold text-lg mb-2">调试合约</h3>
              <p className="mb-4">开发者工具：调试智能合约功能</p>
              <Link href="/debug" passHref className="btn btn-outline btn-sm">
                调试合约
              </Link>
            </div>

            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl opacity-75">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <h3 className="font-bold text-lg mb-2">区块浏览器</h3>
              <p className="mb-4">查看本地区块链交易记录</p>
              <Link href="/blockexplorer" passHref className="btn btn-outline btn-sm">
                区块浏览器
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
