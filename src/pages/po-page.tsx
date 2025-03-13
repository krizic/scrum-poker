import * as React from "react";
import { Button, Segment, Form, Icon } from "semantic-ui-react";
import { toast, ToastContainer } from "react-toastify";
import Papa from "papaparse";

import "./po-page.scss";
import Estimations from "../components/estimations/estimations";
import { ImportZone } from "../components/import-zone/import-zone";
import { WithRoutes, withRouter } from "../utils";
import { EstimationService, EstimationWithVotes, SessionService } from "../api";
import { Estimation, Session } from "../api/model";
import { RealtimeChannel } from "@supabase/supabase-js";

interface IEstimationForm {
  estimation_name: string;
  estimation_description: string;
}

export interface IPoPageProps extends WithRoutes {}

export interface IPoPageState {
  session?: Session;
  estimations?: Estimation[];
  estimationForm?: Partial<IEstimationForm>;
}

class PoPage extends React.Component<IPoPageProps, IPoPageState> {
  sessionService = new SessionService();
  estimationService = new EstimationService();
  sessionId: string | null;
  subs: RealtimeChannel[] = [];

  constructor(props: IPoPageProps) {
    super(props);

    const params = new URLSearchParams(this.props.router.location.search);
    this.sessionId = params.get("id");
    this.state = {};
  }

  componentDidMount() {
    if (this.sessionId) {
      this.getSession();
      this.getEstimations();
      this.subs.push(
        this.estimationService
          .changes("session_id", this.sessionId, this.getEstimations)
          .subscribe()
      );
    } else {
      // redirect him
    }
  }

  componentWillUnmount(): void {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  getSession = () => {
    this.sessionService.get(this.sessionId!).then((session) => {
      this.setState({ session: session });
    });
  };

  getEstimations = () => {
    this.estimationService
      .getBySessionId(this.sessionId!)
      .then((estimations) => {
        this.setState({ estimations: estimations });
        debugger;
      });
  };

  onEstimationFormInputChange = (
    event:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLInputElement>
  ) => {
    const estimationForm = {
      ...this.state.estimationForm,
      ...{ [event.currentTarget.name]: event.currentTarget.value },
    };

    this.setState({ estimationForm });
  };

  onEstimationFormSubmit = (form?: Partial<IEstimationForm>) => {
    if (form && form.estimation_name) {
      this.estimationService.create({
        name: form.estimation_name,
        description: form.estimation_description,
        session_id: this.sessionId!,
      });
    }
  };

  onImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.importEstimationsFromFile(event.target.files[0]);
  };

  onImportFileAccepted = (acceptedFiles: File[]) => {
    this.importEstimationsFromFile(acceptedFiles[0]);
  };

  importEstimationsFromFile = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        console.log(results);

        if (!results.errors.length) {
          const fields = (results.data[0] as string[]).reduce(
            (acc, current, currentIndex) => {
              if (current === "Issue key") {
                acc.issueKey = currentIndex;
              }

              if (current === "Description") {
                acc.description = currentIndex;
              }

              return acc;
            },
            { issueKey: 0, description: 0 }
          );

          const valuesArray = results.data.filter(
            (current, currentIndex, arr) => {
              return currentIndex !== 0 && currentIndex !== arr.length - 1;
            }
          );

          const importedEstimations: Estimation[] = valuesArray.length
            ? valuesArray.map((current: string[]) => {
                return {
                  name: current[fields.issueKey],
                  description: current[fields.description],
                  session_id: this.sessionId!,
                } as Estimation;
              })
            : undefined;

          this.estimationService
            .bulkCreate(importedEstimations)
            .then((response) => {
              console.log("estimationService.bulkCreate", response);
            });
        } else {
          throw new Error("Error parsing file");
        }
      },
    });
  };

  onCopyButtonClick = () => {
    const devSessionUrl = `${window.location.origin}/dev?id=${this.sessionId}`;
    navigator.clipboard.writeText(devSessionUrl);
    toast.success("Dev url Copied!", {
      position: toast.POSITION.BOTTOM_RIGHT,
    });
  };

  public render() {
    const { session, estimations } = this.state;
    const hasEstimations: boolean =
      session && estimations && estimations?.length > 0;
    const estimationsComponent = hasEstimations ? (
      <Estimations
        id={this.state.session.id}
        estimations={estimations}
      ></Estimations>
    ) : (
      <h4> No Estimations</h4>
    );

    return (
      <div id="po-page">
        <div className="wrapper">
          <Segment.Group>
            <Segment secondary clearing className="session-header">
              Session: {this.state.session?.name}
              <Button
                onClick={this.onCopyButtonClick}
                color="blue"
                size="mini"
                floated="right"
                inverted
              >
                <Icon name="share alternate" />
                Copy Invitation Link
              </Button>
            </Segment>
            <Segment.Group className="estimation-form-group" horizontal>
              <Segment>
                <Form
                  onSubmit={(event) => {
                    this.onEstimationFormSubmit(this.state.estimationForm);
                  }}
                >
                  <Form.Field>
                    <input
                      name="estimation_name"
                      placeholder="Story Name"
                      onChange={this.onEstimationFormInputChange}
                      value={this.state.estimationForm?.estimation_name}
                    />
                  </Form.Field>
                  <Form.Field>
                    <textarea
                      rows={2}
                      name="estimation_description"
                      placeholder="Story Description"
                      onChange={this.onEstimationFormInputChange}
                      value={this.state.estimationForm?.estimation_description}
                    ></textarea>
                  </Form.Field>
                  <Button floated="left" type="submit" color="green">
                    <Icon name="angle double down" />
                    Add Story
                  </Button>
                </Form>
              </Segment>
              <Segment className="estimation-form-group__upload">
                <ImportZone
                  onFileUploaded={this.onImportFileAccepted}
                ></ImportZone>
              </Segment>
            </Segment.Group>
          </Segment.Group>
          <Segment.Group className="estimation-container">
            <Segment textAlign="center">{estimationsComponent}</Segment>
          </Segment.Group>
          <ToastContainer autoClose={3000} />
        </div>
      </div>
    );
  }
}

export default withRouter(PoPage);
