"use client";

import { Button } from "@/components/ui/button";
import { IE_ABI, IE_ADDRESS } from "@/lib/ie";
import { useCallback } from "react";
import { usePublicClient, useSwitchChain, useWriteContract } from "wagmi";

export const Execute = ({
  command,
  chainId,
}: {
  command: string;
  chainId: number;
}) => {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const execute = useCallback(async () => {
    switchChain({ chainId });

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
