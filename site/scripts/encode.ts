const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question("Enter command: ", (command: string) => {
  readline.question("Enter chainId: ", (chainId: string) => {
    const url = `${
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/tx"
        : "https://pill.nani.ooo/tx"
    }?command=${encodeURIComponent(command)}&chainId=${encodeURIComponent(
      chainId
    )}`;

    console.log("Generated URL:", url);
    readline.close();
  });
});
