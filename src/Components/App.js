import { Component } from 'react'
import injectTapEventPlugin from 'react-tap-event-plugin'
import axios from 'axios'
import async from 'async'
import moment from 'moment'
import AppBar from 'material-ui/AppBar'
import Drawer from 'material-ui/Drawer'
import Dialog from 'material-ui/Dialog'
import Divider from 'material-ui/Divider'
import MenuItem from 'material-ui/MenuItem'
import Card from 'material-ui/Card'
import DatePicker from 'material-ui/DatePicker'
import TimePicker from 'material-ui/TimePicker'
import TextField from 'material-ui/TextField'
import SelectField from 'material-ui/SelectField'
import SnackBar from 'material-ui/Snackbar'
import {
  Step,
  Stepper,
  StepLabel,
  StepContent,
  StepButton
} from 'material-ui/stepper'
import {
  RadioButton,
  RadioButtonGroup
} from 'material-ui/RadioButton'
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton'
import logo from './../../assets/images/logo.svg'

injectTapEventPlugin()
const HOST = '/' //process.env.XDG_SESSION_ID ? '/' : 'http://localhost:3000/'

export default class App extends Component {
  constructor() {
    super()

    window.location.search
    .slice( 1 )
    .split( '&' )
    .forEach( function( param ) {
      param = param.split( '=' );
      // store.set( param[ 0 ], decodeURIComponent( param[ 1 ] ) );
    });
    

    var offset = new Date().getTimezoneOffset();
    var start_hour = 15 - (offset / 60)
    var hour_array = []
    var start_array = []

    while ( start_array.length < 4 ) {
      let num = (Math.floor(Math.random() * 6) * 10)
      if (start_array.includes(num)) {continue}
      start_array.push(num)
    }
    start_array.sort(function(a, b){return b-a})

    if (start_hour == 11 ){
      hour_array.push(start_hour)
      hour_array.push(start_hour)
      hour_array.push(start_hour + (Math.floor(Math.random() * 7) + 2))
      hour_array.push(start_hour + (Math.floor(Math.random() * 7) + 2))
    }
    else{
      hour_array.push(start_hour + (Math.floor(Math.random() * 7) + 2))
      hour_array.push(start_hour + (Math.floor(Math.random() * 7) + 2))

      hour_array.push(start_hour + 1)
      hour_array.push(start_hour)
    }
    hour_array.sort()


    this.state = {
      loading: true,
      navOpen: false,
      confirmationModalOpen: false,
      confirmationTextVisible: false,
      stepIndex: 0,
      appointmentDateSelected: false,
      appointmentMeridiem: 0,
      validEmail: true,
      validPhone: true,
      smallScreen: window.innerWidth < 768,
      confirmationSnackbarOpen: false,
      hours_array: hour_array,
      starts_array: start_array,
      user_offset: offset
    }

    this.handleNavToggle = this.handleNavToggle.bind(this)
    this.handleNextStep = this.handleNextStep.bind(this)
    this.handleSetAppointmentDate = this.handleSetAppointmentDate.bind(this)
    this.handleSetAppointmentSlot = this.handleSetAppointmentSlot.bind(this)
    this.handleSetAppointmentMeridiem = this.handleSetAppointmentMeridiem.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.validateEmail = this.validateEmail.bind(this)
    this.validatePhone = this.validatePhone.bind(this)
    this.checkDisableDate = this.checkDisableDate.bind(this)
    this.renderAppointmentTimes = this.renderAppointmentTimes.bind(this)
    this.renderConfirmationString = this.renderConfirmationString.bind(this)
    this.renderAppointmentConfirmation = this.renderAppointmentConfirmation.bind(this)
    this.resize = this.resize.bind(this)
  }

  handleNavToggle() {
    return this.setState({ navOpen: !this.state.navOpen })
  }

  handleNextStep() {
    const { stepIndex } = this.state
    return (stepIndex < 3) ? this.setState({ stepIndex: stepIndex + 1}) : null
  }

  handleSetAppointmentDate(date) {
    this.handleNextStep()
    this.setState({ appointmentDate: date, confirmationTextVisible: true })
  }

  handleSetAppointmentSlot(slot) {
    this.handleNextStep()
    this.setState({ appointmentSlot: slot })
  }

  handleSetAppointmentMeridiem(meridiem) {
    this.setState({ appointmentMeridiem: meridiem})
  }

  handleFetch(response) {
    const { configs, appointments } = response
    const initSchedule = {}
    const today = moment().startOf('day')
    initSchedule[today.format('YYYY-DD-MM')] = true
    const schedule = !appointments.length ? initSchedule : appointments.reduce((currentSchedule, appointment) => {
      const { date, slot } = appointment
      const dateString = moment(date, 'YYYY-DD-MM').format('YYYY-DD-MM')
      !currentSchedule[date] ? currentSchedule[dateString] = Array(8).fill(false) : null
      Array.isArray(currentSchedule[dateString]) ?
        currentSchedule[dateString][slot] = true : null
      return currentSchedule
    }, initSchedule)

    //Imperative x 100, but no regrets
    for (let day in schedule) {
      let slots = schedule[day]
      slots.length ? (slots.every(slot => slot === true)) ? schedule[day] = true : null : null
    }

    this.setState({
      schedule,
      siteTitle: configs.site_title,
      aboutPageUrl: configs.about_page_url,
      contactPageUrl: configs.contact_page_url,
      homePageUrl: configs.home_page_url,
      loading: false
    })
  }

  handleFetchError(err) {
    console.log(err)
    this.setState({ confirmationSnackbarMessage: 'Error fetching data', confirmationSnackbarOpen: true })
  }

  handleSubmit() {
    const split = this.state.appointmentDate.toString().split(' 00:00:00 ')
    const calc_military = this.state.appointmentSlot.includes("PM") ?   (parseInt(this.state.appointmentSlot.split(' PM')[0].split(':')[0]) + 12) + ':' + parseInt(this.state.appointmentSlot.split(' PM')[0].split(':')[1]): this.state.appointmentSlot.split(' AM')[0]
    const date_time =  split[0] + ' ' + calc_military + ':00 ' + split[1]  //moment().format('YYYY-DD-MM h:mm a')
    const appointment = {
      date: moment(this.state.appointmentDate).format('YYYY-DD-MM'),
      slot: date_time,
      // name: this.state.firstName + ' ' + this.state.lastName,
      // email: this.state.email,
      phone: this.state.phone
    }
    axios.post(HOST + 'api/appointments', appointment)
    .then(response => this.setState({ confirmationSnackbarMessage: "Appointment succesfully added!", confirmationSnackbarOpen: true, processed: true }))
    .catch(err => {
      console.log(err)
      return this.setState({ confirmationSnackbarMessage: "Appointment failed to save.", confirmationSnackbarOpen: true })
    })
  }

  validateEmail(email) {
    const regex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
    return regex.test(email) ? this.setState({ email: email, validEmail: true }) : this.setState({ validEmail: false })
  }

  validatePhone(phoneNumber) {
    const regex = /^(1\s|1|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/
    return regex.test(phoneNumber) ? this.setState({ phone: phoneNumber, validPhone: true }) : this.setState({ validPhone: false })
  }

  checkDisableDate(day) {
    const dateString = moment(day).format('YYYY-DD-MM')
    return this.state.schedule[dateString] === true || moment(day).startOf('day').diff(moment().startOf('day')) < 0
  }

  renderConfirmationString() {
    const spanStyle = {color: '#00bcd4'}
    return this.state.confirmationTextVisible ? <h2 style={{ textAlign: this.state.smallScreen ? 'center' : 'left', color: '#bdbdbd', lineHeight: 1.5, padding: '0 10px', fontFamily: 'Roboto'}}>
      { <span>
        Scheduling a

          <span style={spanStyle}> 10 Minute </span>

        appointment {this.state.appointmentDate && <span>
          on <span style={spanStyle}>{moment(this.state.appointmentDate).format('dddd[,] MMMM Do')}</span>
      </span>} {Number.isInteger(1) && <span>at <span style={spanStyle}>{this.state.appointmentSlot}</span></span>}
      </span>}
    </h2> : null
  }

  renderAppointmentTimes() {
    const hour_array = [...this.state.hours_array]
    const start_array = [...this.state.starts_array]

    if (!this.state.loading) {
      const slots = [...Array(4).keys()]
      return slots.map(slot => {
        const appointmentDateString = moment(this.state.appointmentDate).format('YYYY-DD-MM')
        // + ' - ' + t2.format('h:mm a')}
        const cur_hour = hour_array.pop()
        const number_start = start_array.pop()
        const t1 = moment().hour(cur_hour).minute(number_start).add(0, 'minutes')
        const t2 = moment().hour(cur_hour).minute(number_start).add(10, 'minutes')
        const scheduleDisabled = this.state.schedule[appointmentDateString] ? this.state.schedule[moment(this.state.appointmentDate).format('YYYY-DD-MM')][slot] : false
        const meridiemDisabled = this.state.appointmentMeridiem ? t1.format('a') === 'am' : t1.format('a') === 'pm'
        const time = ( cur_hour > 12 ? ( cur_hour - 12 ) : cur_hour) + ':' + (number_start == 0 ? '00' : number_start) + (cur_hour > 12 ? ' PM' : ' AM')
        return <RadioButton
          label={t1.format('h:mm a')} 
          key={slot}
          value={time}
          style={{marginBottom: 15, display: meridiemDisabled ? 'none' : 'inherit'}}
          disabled={scheduleDisabled || meridiemDisabled}/>
      })
    } else {
      return null
    }
  }

  renderAppointmentConfirmation() {
    const spanStyle = { color: '#00bcd4' }
    return <section>
      {/* <p>Name: <span style={spanStyle}>{this.state.firstName} {this.state.lastName}</span></p> */}
      <p>Number: <span style={spanStyle}>{this.state.phone}</span></p>
      {/* <p>Email: <span style={spanStyle}>{this.state.email}</span></p> */}
      <p>Appointment: <span style={spanStyle}>{moment(this.state.appointmentDate).format('dddd[,] MMMM Do[,] YYYY')}</span> at <span style={spanStyle}>{this.state.appointmentSlot}</span></p>
    </section>
  }

  resize() {
    this.setState({ smallScreen: window.innerWidth < 768 })
  }

  componentWillMount() {
    async.series({
      configs(callback) {
        axios.get(HOST + 'api/config').then(res =>
          callback(null, res.data.data)
        )
      },
      appointments(callback) {
        axios.get(HOST + 'api/appointments').then(res => {
          callback(null, res.data.data)
        })
      }
    }, (err,response) => {
      err ? this.handleFetchError(err) : this.handleFetch(response)
    })
    addEventListener('resize', this.resize)
  }

  componentWillUnmount() {
    removeEventListener('resize', this.resize)
  }

  render() {
    const { stepIndex, loading, navOpen, smallScreen, confirmationModalOpen, confirmationSnackbarOpen, ...data } = this.state
    // const contactFormFilled = data.firstName && data.lastName && data.phone && data.email && data.validPhone && data.validEmail
    const contactFormFilled = data.phone && data.validPhone
    const modalActions = [
      <FlatButton
        label="Cancel"
        primary={false}
        onClick={() => this.setState({ confirmationModalOpen : false})} />,
      <FlatButton
        label="Confirm"
        primary={true}
        onClick={() => this.handleSubmit()} />
    ]
    return (
      <div>
        <AppBar
          title={data.siteTitle}
          onLeftIconButtonTouchTap={() => this.handleNavToggle() }/>
        <section style={{
            maxWidth: !smallScreen ? '80%' : '100%',
            margin: 'auto',
            marginTop: !smallScreen ? 20 : 0,
          }}>
          {this.renderConfirmationString()}
          <Card style={{
              padding: '10px 10px 25px 10px',
              height: smallScreen ? '100vh' : null
            }}>
            <Stepper
              activeStep={stepIndex}
              linear={false}
              orientation="vertical">
              <Step disabled={loading}>
                <StepButton onClick={() => this.setState({ stepIndex: 0 })}>
                  Choose an available day for your appointment
                </StepButton>
                <StepContent>
                  <DatePicker
                      style={{
                        marginTop: 10,
                        marginLeft: 10
                      }}
                      value={data.appointmentDate}
                      hintText="Select a date"
                      mode={smallScreen ? 'portrait' : 'landscape'}
                      onChange={(n, date) => this.handleSetAppointmentDate(date)}
                      shouldDisableDate={day => this.checkDisableDate(day)}
                       />
                  </StepContent>
              </Step>
              <Step disabled={ !data.appointmentDate }>
                <StepButton onClick={() => this.setState({ stepIndex: 1 })}>
                  Choose an available time for your appointment
                </StepButton>
                <StepContent>
                  <SelectField
                    floatingLabelText="Morning or Afternoon"
                    value={data.appointmentMeridiem}
                    onChange={(evt, key, payload) => this.handleSetAppointmentMeridiem(payload)}
                    selectionRenderer={value => value ? 'Afternoon' : 'Morning'}>
                    <MenuItem value={0}>Morning</MenuItem>
                    <MenuItem value={1}>Afternoon</MenuItem>
                  </SelectField>
                  <RadioButtonGroup
                    style={{ marginTop: 15,
                             marginLeft: 15
                           }}
                    name="appointmentTimes"
                    defaultSelected={data.appointmentSlot}
                    onChange={(evt, val) => this.handleSetAppointmentSlot(val)}>
                    {this.renderAppointmentTimes()}
                  </RadioButtonGroup>
                </StepContent>
              </Step>
              <Step disabled={ !Number.isInteger(this.state.appointmentSlot) }>
                <StepButton onClick={() => this.setState({ stepIndex: 2 })}>
                  Share your contact information with us and we'll send you a reminder
                </StepButton>
                <StepContent>
                  <section>
                    {/* <TextField
                      style={{ display: 'block' }}
                      name="first_name"
                      hintText="First Name"
                      floatingLabelText="First Name"
                      onChange={(evt, newValue) => this.setState({ firstName: newValue })}/>
                    <TextField
                      style={{ display: 'block' }}
                      name="last_name"
                      hintText="Last Name"
                      floatingLabelText="Last Name"
                      onChange={(evt, newValue) => this.setState({ lastName: newValue })}/>
                    <TextField
                      style={{ display: 'block' }}
                      name="email"
                      hintText="name@mail.com"
                      floatingLabelText="Email"
                      errorText={data.validEmail ? null : 'Enter a valid email address'}
                      onChange={(evt, newValue) => this.validateEmail(newValue)}/> */}
                    <TextField
                      style={{ display: 'block' }}
                      name="phone"
                      hintText="(888) 888-8888"
                      floatingLabelText="Phone"
                      errorText={data.validPhone ? null: 'Enter a valid phone number'}
                      onChange={(evt, newValue) => this.validatePhone(newValue)} />
                    <RaisedButton
                      style={{ display: 'block' }}
                      label={contactFormFilled ? 'Schedule' : 'Fill out your information to schedule'}
                      labelPosition="before"
                      primary={true}
                      fullWidth={true}
                      onClick={() => this.setState({ confirmationModalOpen: !this.state.confirmationModalOpen })}
                      disabled={!contactFormFilled || data.processed }
                      style={{ marginTop: 20, maxWidth: 100}} />
                  </section>
                </StepContent>
              </Step>
            </Stepper>
          </Card>
          <Dialog
            modal={true}
            open={confirmationModalOpen}
            actions={modalActions}
            title="Confirm your appointment">
            {this.renderAppointmentConfirmation()}
          </Dialog>
          <SnackBar
            open={confirmationSnackbarOpen || loading}
            message={loading ? 'Loading... ' : data.confirmationSnackbarMessage || ''}
            autoHideDuration={10000}
            onRequestClose={() => this.setState({ confirmationSnackbarOpen: false })} />
        </section>
      </div>
    )
  }
}
