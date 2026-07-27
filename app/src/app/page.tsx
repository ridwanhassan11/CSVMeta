"use client";

import { useState } from "react";

import Sidebar from "../components/Sidebar";
import UploadCard from "../components/UploadCard";
import PreviewGrid from "../components/PreviewGrid";
import ResultCard from "../components/ResultCard";
import ApiKeyModal from "../components/ApiKeyModal";


export default function Home() {

  const [image, setImage] = useState<File | null>(null);

  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);


  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [keywords, setKeywords] = useState<string[]>([]);



  const [showKeys, setShowKeys] = useState(false);

  const [apiKey, setApiKey] = useState("");

  const [savedKeys, setSavedKeys] = useState<string[]>([]);



  function handleImageSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {

    const file = e.target.files?.[0];

    if (!file) return;


    setImage(file);

    setPreview(
      URL.createObjectURL(file)
    );


    setTitle("");

    setDescription("");

    setKeywords([]);

  }



  function removeImage() {

    setImage(null);

    setPreview(null);

    setTitle("");

    setDescription("");

    setKeywords([]);

  }



  async function generateMetadata() {


    if (!image) {

      alert("Select an image first.");

      return;

    }


    setLoading(true);



    const formData = new FormData();

    formData.append(
      "file",
      image
    );



    try {


      const res = await fetch(
        "/api/generate",
        {
          method: "POST",
          body: formData,
        }
      );



      const data = await res.json();



      console.log("API RESPONSE:", data);



      setTitle(
        data.title || ""
      );


      setDescription(
        data.description || ""
      );


      setKeywords(
        data.keywords || []
      );



    } catch(error) {


      console.error(error);

      alert("Something went wrong.");

    }



    setLoading(false);

  }



  function addKey() {

    if (!apiKey) return;


    setSavedKeys([
      ...savedKeys,
      apiKey
    ]);


    setApiKey("");

  }



  return (

    <main className="min-h-screen bg-[#0b1220] text-white">


      <Sidebar />


      <section className="ml-80 p-8">


        <div className="flex items-center justify-between">


          <div>

            <h1 className="text-4xl font-bold">
              AI Metadata Studio
            </h1>


            <p className="mt-2 text-slate-400">
              Generate professional stock metadata with AI.
            </p>

          </div>



          <button
            onClick={() => setShowKeys(true)}
            className="rounded-xl bg-blue-600 px-5 py-3"
          >
            🔑 API Keys
          </button>


        </div>
                <div className="mt-8 grid gap-6 md:grid-cols-3">


          <div className="rounded-3xl border border-slate-800 bg-[#121a2d] p-6">

            <p className="text-slate-400">
              Images
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              {image ? 1 : 0}
            </h2>

          </div>



          <div className="rounded-3xl border border-slate-800 bg-[#121a2d] p-6">

            <p className="text-slate-400">
              Credits
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              100
            </h2>

          </div>



          <div className="rounded-3xl border border-slate-800 bg-[#121a2d] p-6">

            <p className="text-slate-400">
              AI Model
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Gemini
            </h2>

          </div>


        </div>



        <UploadCard
          onSelect={handleImageSelect}
        />



        <PreviewGrid
          imageUrl={preview}
          onRemove={removeImage}
        />



        {image && (

          <button
            onClick={generateMetadata}
            disabled={loading}
            className="mt-8 rounded-xl bg-green-600 px-8 py-4 font-semibold hover:bg-green-500"
          >

            {
              loading
              ? "Generating..."
              : "Generate Metadata"
            }

          </button>

        )}



        <ResultCard
          loading={loading}
          title={title}
          description={description}
          keywords={keywords}
        />



        <ApiKeyModal

          open={showKeys}

          apiKey={apiKey}

          savedKeys={savedKeys}

          setApiKey={setApiKey}

          addKey={addKey}

          close={() => setShowKeys(false)}

        />


      </section>

    </main>

  );

}