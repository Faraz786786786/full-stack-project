import validator from 'validator'
import bcrypt from 'bcryptjs';
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'

//API to register user
const registerUser = async (req, res) => {
  try {

    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" })
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "enter a valid email" })
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "enter a strong password" })
    }

    //hashing user password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const userData = {
      name,
      email,
      password: hashedPassword
    }

    const newUser = new userModel(userData)

    const user = await newUser.save()

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

    res.json({ success: true, token })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })

  }
}

//API for user login
const loginUser = async (req, res) => {


  try {

    const { email, password } = req.body
    const user = await userModel.findOne({ email })

    if (!user) {
      return res.json({ success: false, message: "User does not exist" })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
      res.json({ success: true, token })
    } else {
      res.json({ success: false, message: "Invalid Credentials" })
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })

  }
}

//API to get user profile data
const getProfile = async (req, res) => {

  try {

    // const {userId} = req.body
    const userId = req.user.id;
    const userData = await userModel.findById(userId).select('-password')

    res.json({ success: true, userData })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })

  }
}

//API to update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ Use ID from authenticated user
    const { name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    // Validation
    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    // Prepare update object
    const updateData = {
      name,
      phone,
      dob,
      gender,
    };

    // Handle address parsing
    if (address) {
      try {
        updateData.address = JSON.parse(address);
      } catch (err) {
        return res.json({ success: false, message: "Invalid address format" });
      }
    }

    // Upload image if provided
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: 'image',
      });
      updateData.image = imageUpload.secure_url;
    }

    // Perform single MongoDB update
    const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "Profile Updated", data: updatedUser });
  } catch (error) {
    console.log("Update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

//API to book appointment
const bookAppointment = async (req, res) => {

  try {

    const userId = req.user.id;
    const { docId, slotDate, slotTime } = req.body
    const docData = await doctorModel.findById(docId).select('-password')

    if (!docData.available) {
      return res.json({ success: false, message: 'Doctor not available' })
    }

    let slots_booked = docData.slots_booked

    //checking for slot availability
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: 'Slot not available' })
      } else {
        slots_booked[slotDate].push(slotTime)
      }
    } else {
      slots_booked[slotDate] = []
      slots_booked[slotDate].push(slotTime)

    }

    const userData = await userModel.findById(userId).select('-password')

    delete docData.slots_booked

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now()
    }
    const newAppointment = new appointmentModel(appointmentData)
    await newAppointment.save()

    //save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId, { slots_booked })

    res.json({ success: true, message: 'Appointment Booked' })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })

  }
}


//API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
  try {

    const userId = req.user.id;

    const appointments = await appointmentModel.find({ userId })

    res.json({ success: true, appointments })


  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })

  }
}

//API to cancel Appointment
const cancelAppointment = async (req, res) => {
  try {

    const userId = req.user.id;
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId)

    //verify appointment user
    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: 'Unauthorized Action' })
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

    //releasing doctor slot

    const { docId, slotDate, slotTime } = appointmentData

    const doctorData = await doctorModel.findById(docId)

    let slots_booked = doctorData.slots_booked

    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

    await doctorModel.findByIdAndUpdate(docId, { slots_booked })

    res.json({ success: true, message: 'Appointment Cancelled' })


  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })

  }
}

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

//API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {

  try {

    const { appointmentId } = req.body

    const appointmentData = await appointmentModel.findById(appointmentId)

    if (!appointmentId || appointmentData.cancelled) {
      return res.json({ success: false, message: "Appointment cancelled or not found" })
    }

    //creating options for razorpay payment
    const options = {
      amount: appointmentData.amount * 100,
      currency: process.env.CURRENCY,
      receipt: appointmentId,

    }

    //creation of an order

    const order = await razorpayInstance.orders.create(options)

    res.json({ success: true, order })

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })


  }


}

//API to verify payment of razorpay

const verifyRazorPay = async (req,res) => {

  try {

    const {razorpay_order_id} = req.body
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

    if (orderInfo.status === 'paid') {
      await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
      res.json({success:true,message:"Payment Successful"})
    }else{
      res.json({success:false,message:"Payment failed"})
    }
    
    
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })

  }
}

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorPay,
}