"use client";

import { Button } from "@/components/ui/button";
import { resolveCommand } from "@/lib/command";
import { IE_ABI, IE_ADDRESS } from "@/lib/ie";
import { useCallback } from "react";
import { erc20Abi, maxUint256 } from "viem";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

export const Execute = ({
  command,
  chainId,
}: {
  command: string;
  chainId: number;
}) => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId });
  const { switchChain } = useSwitchChain();

  const execute = useCallback(async () => {
    switchChain({ chainId });

    if (!publicClient) {
      throw new Error("Initializing public client.");
    }

    if (!address) {
      throw new Error("Is your wallet connected? Can't find address");
    }

    const { action, params } = resolveCommand(command);

    const data = await publicClient.readContract({
      address: IE_ADDRESS,
      abi: IE_ABI,
      functionName: "previewCommand",
      args: [command],
    });

    const approval = await publicClient.readContract({
      address: data[3],
      abi: erc20Abi,
      functionName: "allowance",
      args: [address, IE_ADDRESS],
    });

    if (approval < data[1]) {
      const approveTxHash = await writeContractAsync({
        address: data[3],
        abi: erc20Abi,
        functionName: "approve",
        args: [IE_ADDRESS, maxUint256],
        chainId,
      });

      alert(`Approval Transaction hash: ${approveTxHash}`);
    }

    const txHash = await writeContractAsync({
      address: IE_ADDRESS,
      abi: IE_ABI,
      functionName: "command",
      args: [command],
      chainId,
    });
    alert(`Transaction hash: ${txHash}`);
  }, [command, chainId, writeContractAsync]);

  return <Button onClick={execute}>Execute</Button>;
};
