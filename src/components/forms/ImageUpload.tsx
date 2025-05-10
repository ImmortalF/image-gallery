import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios';

const ImageUpload = () => {

    const [file, setFile] = useState<File | null>(null);
    const { login } = useAuth();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (event.target.files?.length) {
            setFile(event.target.files[0]);
        }
    }



    const uploadImage = async () => {
        if (!file) return alert("Please select an image");
        const contentType = file.type;
        const fileName = file.name;

        if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
            return alert("Invalid file type. Only JPEG, PNG, or WebP allowed.");
        }

        try {
            const { data } = await axios.post(
                "https://77yb146lce.execute-api.us-east-2.amazonaws.com/deployment/presigned-url",
                { fileName, contentType },
                {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`, // ✅ Ensure a valid token is attached
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!data.url) throw new Error("Failed to obtain pre-signed URL.");

            await axios.put(data.url, file, { headers: { "Content-Type": contentType } });

            alert("Image successfuly uploaded!");

        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload image.");
        }

    }

    return (
        <>
            <h2>Upload an Image</h2>
            <input type='file' accept='image/jpeg,image/png,image/webp' onChange={handleFileChange} />
            <button onClick={uploadImage}>Upload</button >
        </>
    )
}

export default ImageUpload
