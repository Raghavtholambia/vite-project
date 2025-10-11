import React from 'react'
import { useState } from 'react'

const TextOpt = () => {
    const [Text, setText] = useState("");

    const handleClick = () => {
        setText(Text.toUpperCase())
    }

 const handleChange = (e) => {
    setText(e.target.value);
  };
  const clear=()=>{
    setText("")
  }


    return (
        <>

            <div classNameName="mb-3">
                <textarea className="form-control" id="exampleFormControlTextarea1" onChange={handleChange} value={Text} rows="3"></textarea>
            </div>
            <button type='button' className="btn-dark my-3 mx-3" onClick={handleClick} >capitalize</button>
            <button type='button' className="btn-danger my-3 mx-3" onClick={clear} >clear</button>

        </>
    )
}

export default TextOpt

