import React, { useEffect, useState, useMemo } from "react";
import { Button, Segment, Form, Icon } from "semantic-ui-react";
import { toast, ToastContainer } from "react-toastify";
import Papa from "papaparse";
import {
  fetchEstimationBySessionId,
  fetchSessionById,
  selectEstimationChangeStream,
  subscribeToEstimationChanges,
  useAppDispatch,
  useAppSelector,
} from "../store";

import "./po-page.scss";
import { Estimations } from "../components/estimations";
import { ImportZone } from "../components/import-zone/import-zone";
import { EstimationService } from "../api";
import { Estimation, Session } from "../api/model";
import { useLocation } from "react-router-dom";

interface IEstimationForm {
  estimation_name: string;
  estimation_description: string;
}

export interface IPoPageProps {}

const PoPage: React.FC<IPoPageProps> = () => {
  const estimationService = new EstimationService();
  const [estimationForm, setEstimationForm] = useState<
    Partial<IEstimationForm>
  >({});
  const dispatch = useAppDispatch();
  const currentSession = useAppSelector((state) => state.session.current);
  const currentEstimations = useAppSelector(
    (state) => state.estimation.current
  );
  const estimationStream = useAppSelector(selectEstimationChangeStream);

  //get session ID
  const { search } = useLocation();

  const sessionId = useMemo(() => {
    const params = new URLSearchParams(search);
    const sessionId = params.get("id");
    return sessionId;
  }, [search]);

  // Initial
  useEffect(() => {
    // initial fetch of session Object
    if (sessionId) {
      getSession(sessionId);
      getEstimations(sessionId);
      subscribeToEstimation(sessionId);
    }
  }, []);

  // Triggered by changes in the stream
  useEffect(() => {
    if (sessionId) {
      getEstimations(sessionId);
    }
  }, [estimationStream]);

  const getEstimations = (sessionId: Session["id"]): void => {
    dispatch(fetchEstimationBySessionId(sessionId));
  };

  const getSession = (sessionId: Session["id"]): void => {
    dispatch(fetchSessionById(sessionId));
  };

  const subscribeToEstimation = (sessionId: Session["id"]): void => {
    dispatch(subscribeToEstimationChanges(sessionId));
  };

  const onEstimationFormInputChange = (
    changeEvent: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = changeEvent.currentTarget;
    setEstimationForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const onEstimationFormSubmit = (form?: Partial<IEstimationForm>) => {
    if (form && form.estimation_name) {
      estimationService.create({
        name: form.estimation_name,
        description: form.estimation_description,
        session_id: sessionId!,
      });
    }
  };

  const importEstimationsFromFile = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
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
                  session_id: sessionId!,
                } as Estimation;
              })
            : undefined;

          estimationService.bulkCreate(importedEstimations).then((response) => {
            console.log("estimationService.bulkCreate", response);
          });
        } else {
          throw new Error("Error parsing file");
        }
      },
    });
  };

  const onImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    importEstimationsFromFile(event.target.files[0]);
  };

  const onImportFileAccepted = (acceptedFiles: File[]) => {
    importEstimationsFromFile(acceptedFiles[0]);
  };

  const onCopyButtonClick = () => {
    const devSessionUrl = `${window.location.origin}/dev?id=${sessionId}`;
    navigator.clipboard.writeText(devSessionUrl);
    toast.success("Dev url Copied!", {
      position: toast.POSITION.BOTTOM_RIGHT,
    });
  };

  const hasEstimations = useMemo(() => {
    return (
      currentSession && currentEstimations && currentEstimations.length > 0
    );
  }, [currentSession, currentEstimations]);

  const estimationComponent = useMemo(() => {
    return hasEstimations ? (
      <Estimations
        id={currentSession!.id}
        estimations={currentEstimations}
      ></Estimations>
    ) : (
      <h4> No Estimations</h4>
    );
  }, [currentSession, currentEstimations, estimationStream]);

  return (
    <div id="po-page">
      <div className="wrapper">
        <Segment.Group>
          <Segment secondary clearing className="session-header">
            Session: {currentSession?.name}
            <Button
              onClick={onCopyButtonClick}
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
                  event.preventDefault();
                  onEstimationFormSubmit(estimationForm);
                }}
              >
                <Form.Field>
                  <input
                    name="estimation_name"
                    placeholder="Story Name"
                    onChange={onEstimationFormInputChange}
                    value={estimationForm?.estimation_name || ""}
                  />
                </Form.Field>
                <Form.Field>
                  <textarea
                    rows={2}
                    name="estimation_description"
                    placeholder="Story Description"
                    onChange={onEstimationFormInputChange}
                    value={estimationForm?.estimation_description || ""}
                  ></textarea>
                </Form.Field>
                <Button floated="left" type="submit" color="green">
                  <Icon name="angle double down" />
                  Add Story
                </Button>
              </Form>
            </Segment>
            <Segment className="estimation-form-group__upload">
              <ImportZone onFileUploaded={onImportFileAccepted}></ImportZone>
            </Segment>
          </Segment.Group>
        </Segment.Group>
        <Segment.Group className="estimation-container">
          <Segment textAlign="center">{estimationComponent}</Segment>
        </Segment.Group>
        <ToastContainer autoClose={3000} />
      </div>
    </div>
  );
};

export default PoPage;
