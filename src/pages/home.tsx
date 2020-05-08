import * as React from "react";
import {
  Button,
  Form,
  Segment,
  Grid,
  Divider,
  List,
  Header,
  CheckboxProps,
} from "semantic-ui-react";
import {withRouter, RouteComponentProps} from "react-router-dom";

import "./home.scss";
import {
  LocalSessionApi,
  ISessionAccess,
} from "../services/local-session-storage";
import {timeFormat} from "../utils";
import {SessionService} from "../api/sessions.service";
import { AppRoutes } from "../constants";

export interface IHomeProps extends RouteComponentProps {}

export interface IHomeState {
  form: IForm;
  valid?: IForm;
  previousSessions: ISessionAccess[] | null;
}

interface IForm {
  name: string;
  password: string;
  private: boolean;
}

enum FormField {
  name = "name",
  password = "password",
  private = "private",
}

class Home extends React.Component<IHomeProps, IHomeState> {
  sessionApi: SessionService = SessionService.Instance;

  state: IHomeState = {
    form: {
      name: "",
      password: "",
      private: false,
    },

    previousSessions: LocalSessionApi.getSessions(),
  };

  componentDidMount() {
    this.sessionApi.info().then((data) => {
      console.log("info", data);
    });
  }

  onFormSubmit = (formData: IForm) => {
    if (formData.name !== "" && (!formData.private || formData.password !== "")) {
      const newSession = {...formData, ...{created_at: new Date().getTime()}};
      this.sessionApi.post(newSession).then((response) => {
        if (response.ok) {
          LocalSessionApi.saveSession({
            _id: response.id,
            name: formData.name,
            password: formData.password,
            created_at: newSession.created_at,
          });
          this.props.history.push(`${AppRoutes.Session}/${response.id}`);
        }
      });
    }
  };

  onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const form = {
      ...this.state.form,
      ...{[event.currentTarget.name]: event.currentTarget.value},
    };
    this.setState({form});
  };

  onPreviousSessionDelete = (event: React.MouseEvent, sessionId: string) => {
    event.stopPropagation();
    this.sessionApi.delete(sessionId).finally(() => {
      LocalSessionApi.deleteSession(sessionId);
      this.setState({previousSessions: LocalSessionApi.getSessions()});
    });
  };

  onSessionLinkClick = (sessionId: string) => {
    this.props.history.push(`${AppRoutes.Session}/${sessionId}`);
  };

  public render() {
    return (
      <div id="home-page">
        <Segment raised>
          <Grid columns={2} stackable>
            <Grid.Column verticalAlign="middle">
              <Header textAlign="center">New Session</Header>
              <Form
                onSubmit={(e) => {
                  this.onFormSubmit(this.state.form);
                }}
              >
                <Form.Input
                  required
                  fluid
                  icon="clock outline"
                  iconPosition="left"
                  name={FormField.name}
                  value={this.state.form.name}
                  label="Session Name"
                  placeholder="Session Name"
                  onChange={this.onInputChange}
                  className={this.state.valid?.name}
                />
                <Form.Checkbox
                  toggle
                  name={FormField.private}
                  checked={this.state.form.private}
                  label="Private"
                  onChange={(
                    event: React.SyntheticEvent,
                    data: CheckboxProps
                  ) => {
                    const form = {
                      ...this.state.form,
                      ...{[FormField.private]: data.checked},
                    };
                    this.setState({form});
                  }}
                />
                {this.state.form.private && (
                  <Form.Input
                    required={this.state.form.private}
                    fluid
                    icon="lock"
                    iconPosition="left"
                    name={FormField.password}
                    value={this.state.form.password}
                    label="Session Password"
                    placeholder="Session Password"
                    onChange={this.onInputChange}
                  />
                )}

                <Button type="submit" primary>
                  Submit
                </Button>
              </Form>
            </Grid.Column>
            <Grid.Column verticalAlign="top">
              <Header textAlign="center">Your Recent Sessions</Header>
              <List divided verticalAlign="middle">
                {this.state.previousSessions?.length ? (
                  this.state.previousSessions?.map((session) => {
                    return (
                      <List.Item
                        as="a"
                        key={session._id}
                        onClick={() => {
                          this.onSessionLinkClick(session._id);
                        }}
                      >
                        <List.Content floated="right">
                          <Button
                            icon="times circle outline"
                            onClick={(e) => {
                              this.onPreviousSessionDelete(e, session._id);
                            }}
                          ></Button>
                        </List.Content>
                        <List.Icon
                          name="clock outline"
                          verticalAlign="middle"
                        />
                        <List.Content>
                          <List.Header>{session.name}</List.Header>
                          <List.Description>
                            {timeFormat(session.created_at)}
                          </List.Description>
                        </List.Content>
                      </List.Item>
                    );
                  })
                ) : (
                  <List.Item>
                    <List.Content>No previous sessions</List.Content>
                  </List.Item>
                )}
              </List>
            </Grid.Column>
          </Grid>
          <Divider vertical>Or</Divider>
        </Segment>
      </div>
    );
  }
}

export default withRouter(Home);
