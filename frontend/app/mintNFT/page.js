"use client"
import React , {useState , useRef, useEffect} from 'react'
import Header from '@/Component/Header/Header'
import {ThirdwebProvider} from "@thirdweb-dev/react"
import { Box,HStack , ChakraProvider, FormControl,Spinner , Heading, VStack , Input , Button, StatLabel  } from '@chakra-ui/react'
require("dotenv").config()
import axios from 'axios'
import Style from "./mintNFT.module.css"
import { ethers } from 'ethers'
import { NFTStorage, File } from 'nft.storage'
import {aiftAddress  , aiftabi} from "../../constant"

const MintNFT = () => {
    const [loadingImage , setloadingImage] = useState(false);
    const [mintingNFT , setmintingnft] = useState(false)
    const [message , setMessage] = useState("")
    const [img , setImage] = useState('');
    const [name, setName] = useState("")
    const [description, setDescription] = useState("");
    const [tokenURI , settokenURI] = useState("");


// getting  the image from hugging face
    const createAIImage = async () => {
        
        setMessage("Generating Image...")
        setloadingImage(true)

        const URL = `https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2`
    
        // Send the request
        const response = await axios({
          url: URL,
          method: 'POST',
          headers: {
            Authorization: `Bearer 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`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          data: JSON.stringify({
            inputs: description, options: { wait_for_model: true },
          }),
          responseType: 'arraybuffer',
        })

        setMessage("Getting Data From Hugging Face API...")

        const type = response.headers['content-type']
        const data = response.data
    
        const base64data = Buffer.from(data).toString('base64')
        const img = `data:${type};base64,` + base64data // <-- This is so we can render it on the page

        setMessage('Displaying the Image...')

        setImage(img)
        setloadingImage(false)
        return data
      }

      const submitImageDisplay = async (e) => {
        e.preventDefault();

        if(description === ""){
            window.alert("Please provide description")
        }

       const data =  await createAIImage();
       console.log(data)
      }

      // upload metadata to the ipfs via nft.storage
      const uploadImage = async(imageData) => {
        // Create instance to NFT.Storage
        const nftstorage = new NFTStorage({ token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDAzM2Y5Mzc1ZEQ5ODY1YzhmN2FiODVENGRiRTM3NDhERWI4NTljRkYiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY4NTc3MTE1MDk5NiwibmFtZSI6IlBBUkszIn0.eHLoAl-RBIxAqXmHm_KTQ553Ha-_18sZrnoxuXpGxMI })

    // Send request to store image
    const { ipnft } = await nftstorage.store({
      image: new File([imageData], "image.jpeg", { type: "image/jpeg" }),
      name: name,
      description: description,
    })


    // minting the nft from tokenURI
    const mintAIFT = async (tokenURI) => {
            setmintingnft(true);
            try{
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();

                let contract = new ethers.Contract(aiftAddress, aiftabi, signer);
                const tx = await contract.createNFT(tokenURI);
                await tx.wait();

                setmintingnft(false)
                settokenURI(ipnft)

                const transactionHash = tx.hash;
                signer.provider.on(transactionHash, (receipt) => {
                  alert('Transaction confirmed:');
                });

                return ipnft
            }catch(error){
                console.log(error)
            }
      }



      // handling mitning of image
      const handleMint = async() => { 
        setmintingnft(true);

        const imgData = await createAIImage();

        const tokenURI = await uploadImage(imgData);
         
        await mintAIFT(tokenURI);

        setmintingnft(false);
      }
      
   


  return (
    <>
    <ThirdwebProvider>
        <ChakraProvider>
        <Header/>
    <Heading alignSelf={'center'} textAlign={'center'} size={'lg'}  >
        MINT  <span >AIFT</span> 
    </Heading>
    
        <HStack padding={"2rem 0 2rem 10rem "} align={'center'} alignSelf={'center'}  spacing={"5rem"} minH={'600px'} >
               <form onSubmit={submitImageDisplay}>
                <VStack spacing={'4'}>
                    <FormControl>
                      <Input
                        type='text'
                        onChange={(event) => setName(event.target.value)}
                        placeholder='Enter Name...'
                        borderColor='#ff8700'
                        size='lg'
                        borderRadius='6px'
                        required
                      />
                    </FormControl>
                    <FormControl>
                      <Input
                        type='text'
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder='Enter Description... '
                        borderColor='#ff8700'
                        size='lg'
                        borderRadius='6px'
                        required
                      />
                    </FormControl>

                    {!loadingImage && img ? (
                                  <Button
                                  padding={"0 6rem"}
                                    bg='#ff8700'
                                    color='#fff'
                                    size='lg'
                                    _hover={{bg:"#ff8700", color:"#fff"}}
                                    _active={{ bg: '#298e46' }}
                                    onClick={handleMint}
                                  >
                                    Mint AIFT
                                  </Button>
                    )     :    

                    <Button
                    padding={"0 6rem"}
                      bg='#ff8700'
                      color='#fff'
                      size='lg'
                      _hover={{bg:"#ff8700", color:"#fff"}}
                      _active={{ bg: '#298e46' }}
                      type='submit'
                      onClick={submitImageDisplay}
                    >
                      Get Image
                    </Button>
}

                </VStack>

               </form>
            

            <Box className={Style.image}>
                {!loadingImage && img ? (
                    <img src={img} alt='AI Generated Image'/>
                ): loadingImage ? (
                    <div className={Style.image__placeholder}>
                   <Spinner size='xl'   thickness='4px' speed='0.65s' emptyColor='gray.200' color='#ff8700'  />
              <p style={{paddingLeft:'1rem' , fontSize:"1.4rem"}} >{message} </p>
            </div>
                ) : (
                    <></>
                )}

            </Box>
        </HStack>



        </ChakraProvider>
    </ThirdwebProvider>
    </>
   
  )
}
}
export default MintNFT