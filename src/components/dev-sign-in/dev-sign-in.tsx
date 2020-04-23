import * as React from "react";
import {
  Form,
  Dropdown,
  Divider,
  Button,
  Segment,
  DropdownProps,
  Grid,
  Header,
} from "semantic-ui-react";
import {v4 as uuid} from "uuid";

import {IUserInfo, LocalUserInfoApi} from "../../services";
import PokerCard from "../poker-card/poker-card";

export interface IDevSignInProps {
  onUserSign: (userInfo: IUserInfo) => any;
}

export interface IDevSignInState {
  userInfoForm: IUserInfo;
  userInfo?: IUserInfo;
}

export default class DevSignIn extends React.Component<
  IDevSignInProps,
  IDevSignInState
> {
  constructor(props: IDevSignInProps) {
    super(props);

    this.state = {
      userInfoForm: {
        email: "",
      },
    };
  }

  patternOptions = [
    {
      key: "1267",
      text: "Pink-Yellow",
      value: "1267",
      image: {src: "/patterns/1267.png"},
    },
    {
      key: "2109",
      text: "Red-Cream",
      value: "2109",
      image: {src: "/patterns/2109.png"},
    },
    {
      key: "9248",
      text: "Blue-Cream",
      value: "9248",
      image: {src: "/patterns/9248.png"},
    },
    {
      key: "10680",
      text: "BW-Red",
      value: "10680",
      image: {src: "/patterns/10680.png"},
    },
    {
      key: "18242",
      text: "Yellow-Cream",
      value: "18242",
      image: {src: "/patterns/18242.png"},
    },
    {
      key: "8126",
      text: "Red-Blue",
      value: "8126",
      image: {src: "/patterns/8126.png"},
    },
  ];

  onUserInfoFormSubmit = () => {
    const userInfo = {
      ...this.state.userInfoForm,
      id: uuid(),
    };
    LocalUserInfoApi.saveUserInfo(userInfo);
    this.props.onUserSign(userInfo);
  };

  onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const userInfoForm: IUserInfo = {
      ...this.state.userInfoForm,
      ...{[event.currentTarget.name]: event.currentTarget.value},
    };
    this.setState({userInfoForm});
  };

  onSelectChange = (
    event: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    const userInfoForm: IUserInfo = {
      ...this.state.userInfoForm,
      ...{pattern: data.value as string},
    };

    this.setState({userInfoForm});
  };

  public render() {
    return (
      <Segment raised className="form-wrapper">    
        <Grid stackable>
          <Grid.Row verticalAlign="middle">
            <Grid.Column width={10}>
            <Header textAlign="center">Developer Info</Header>
              <Form onSubmit={this.onUserInfoFormSubmit}>
                <Form.Input
                  required
                  fluid
                  value={this.state.userInfoForm.username}
                  icon="user outline"
                  iconPosition="left"
                  placeholder="Username"
                  onChange={this.onInputChange}
                  name="username"
                />
                <Form.Input
                  fluid
                  value={this.state.userInfoForm.email}
                  icon="mail outline"
                  iconPosition="left"
                  placeholder="Email"
                  onChange={this.onInputChange}
                  name="email"
                />
                <Form.Field>
                  <Dropdown
                    labeled={true}
                    placeholder="Select Card Pattern"
                    name="pattern"
                    fluid
                    value={this.state.userInfoForm.pattern}
                    selection
                    options={this.patternOptions}
                    onChange={this.onSelectChange}
                  />
                </Form.Field>
                <Divider />
                <Button type="submit" primary>
                  Submit
                </Button>
              </Form>
            </Grid.Column>
            <Grid.Column width={1}>
              <PokerCard
                side="back"
                voterPattern={this.state.userInfoForm.pattern}
                voterUsername={this.state.userInfoForm.username}
                voterEmail={this.state.userInfoForm.email}
                withProfilePic={true}
              >
                <div>{this.state.userInfoForm.username ?? "Unknown"}</div>
              </PokerCard>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    );
  }
}
