// import axios from "axios";
const login=async(email,password)=>{

    let data={email,password};
    try{
    const res= await axios({
            method:'POST',
            url:'http://127.0.0.1:8000/api/v1/users/login',
            data
        });

        if(res.data.status==='success')
        {
            alert('Logged in successfully');
            window.setTimeout(()=>{
                location.assign('/');
            },1500)
        }
        console.log(res);
    }catch(err)
    {
        console.log("Error"+err);
        alert(err);
    }
}


document.querySelector('.form').addEventListener('submit',(e)=>{
    e.preventDefault();

    const email=document.getElementById('email').value;
    const password=document.getElementById('password').value;
    login(email,password);
})