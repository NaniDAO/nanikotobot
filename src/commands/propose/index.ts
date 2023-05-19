

export const extractVote = (proposal: string, content: string) => {
    

}

interface AddTxBody {
    txHash: string;
    op: string;
    to: string;
    value: string;
    data: string;
    nonce: number;
    title: string;
    content: any; // Replace 'any' with your actual content type
    userId: string;
}


  
async function sendTransaction(chainId: number = 1, address: string = '0x379569b497ee6fdeb6f6128b9f59efb49b85e3a2', body: AddTxBody): Promise<void> {
    try {
        const KEEP_API_KEY = process.env.KEEP_API_KEY;

        if (!KEEP_API_KEY) {
            throw new Error('KEEP_API_KEY is not set');
        }

      
      const response = await fetch(`http://localhost:8000/keeps/${chainId}/${address}/addTx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEEP_API_KEY}`
        },
        body: JSON.stringify(body)
      });
  
      if (!response.ok) {
        const message = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${message}`);
      }
  
      const data = await response.json();
      console.log('Transaction sent: ', data);
    } catch (error) {
      console.error('Error creating transaction: ', error);
    }
  }
  
