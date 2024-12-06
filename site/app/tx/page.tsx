import { Execute } from "./execute";

export default function Tx({
  searchParams,
}: {
  searchParams: { command: string; chainId: string };
}) {
  const command = searchParams.command;
  const chainId = parseInt(searchParams.chainId);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col space-y-2 items-start justify-start">
        <h1 className="bg-nani-green p-2">{command}</h1>
        <h2 className="bg-nani-yellow text-black p-2">
          Executing on {chainId}
        </h2>
        <Execute command={command} chainId={chainId} />
      </div>
    </div>
  );
}
