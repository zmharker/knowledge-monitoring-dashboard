import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ApolloConsumer, graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
// https://reactjs.org/docs/update.html
import update from 'immutability-helper';

import { ALPHABET } from '../../constants';
import ErrorBox from '../shared/ErrorBox';

// TinyMCE imports and config
import tinymce from 'tinymce/tinymce';
import 'tinymce/themes/modern/theme';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/hr';
import 'tinymce/plugins/image';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import { Editor } from '@tinymce/tinymce-react';

const tinymceConfig = {
    skin_url: '/tinymce/lightgray',
    plugins: 'autoresize charmap hr image link lists',
    toolbar: 'undo redo | formatselect | fontsizeselect | bold italic underline | align | bullist numlist | outdent indent | superscript subscript | removeformat | image link charmap',
    menubar: false,
    statusbar: false,
    branding: false,
    autoresize_max_height: 500,
    fixed_toolbar_container: '#editor-toolbar'
};

export class CollapsibleQuestionEditor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            isExpanded: props.defaultExpanded,
            error: null,
            question: null,
        };

        // Pre-bind functions
        this._loadQuestion = this._loadQuestion.bind(this);
        this._deleteQuestion = this._deleteQuestion.bind(this);
        this._saveQuestion = this._saveQuestion.bind(this);
        this._discardChanges = this._discardChanges.bind(this);
        
        this._handlePromptChange = this._handlePromptChange.bind(this);
    }
    
    componentDidMount() {
        // If starting expanded, call the query immediately
        if (this.state.isExpanded) {
            this._loadQuestion();
        }
    }
    
    async _loadQuestion() {
        // Don’t reload question if already expanded
        if (this.state.isExpanded) { return; }
        try {
            this.setState({ isLoading: true });
            const result = await this.props.client.query({
                query: QUESTION_QUERY,
                variables: { id: this.props.questionId }
            });
            this.setState({ isLoading: false, question: result.data.question, isExpanded: true });
        } catch (error) {
            console.error(error);
            this.setState({ error: 'Error loading question: ' + error });
        }
    }

    async _deleteQuestion() {
        // TODO
        alert('todo');
    }
    
    async _saveQuestion() {
        // TODO
        alert('todo');
        return;
        const { question } = this.state;
        // Prisma-specific syntax for nested update mutation
        let updatedQuestion = {
            where: { id: question.id },
            data: {
                prompt: question.prompt,
                concept: document.getElementById('concept' + question.id).value,
                options: { update: [] }
            }
        };
        // Add concept to quiz concept list
        //quizData.concepts.push(document.getElementById('concept' + question.id).value);
        // Get updated options for this question
        question.options.forEach(option => {
            let updatedOption = {
                where: { id: option.id },
                data: {
                    text: document.getElementById(option.id + 'text').value,
                    isCorrect: document.getElementById(option.id + 'radio').checked
                }
            };
            // Add updated option to question mutation
            updatedQuestion.data.options.update.push(updatedOption);
        });

    }

    _discardChanges() {
        this.setState({ question:null, isExpanded: false });
    }

    _handlePromptChange(newPrompt) {
        let question = update(this.state.question, { $merge: { prompt: newPrompt } });
        this.setState({ question });
    }
    
    render() {
        const { isExpanded, isLoading, question, error } = this.state;
        console.log(this.state);

        if (error || (isExpanded && !isLoading && !(question && question.id))) {
            return <ErrorBox><p>{error}</p></ErrorBox>;
        }

        // If this is part of a reorderable list, show a drag handle
        const dragHandle = this.props.dragHandleProps && (
            <span {...this.props.dragHandleProps} className="icon is-inline-block is-flex drag-handle">
                <i className="fas fa-grip-vertical"></i>
            </span>
        );

        const saveButton = isExpanded && (
            <button className={"button is-link" + (isLoading ? " is-loading" : "")} onClick={this._saveQuestion}>
                <span>Save</span>
            </button>
        );

        const cancelButton = isExpanded && (
            <button className="button" onClick={this._discardChanges}>
                <span>Cancel</span>
            </button>
        );

        const editButton = !isExpanded && (
            <button className={"button" + (isLoading ? " is-loading" : "")} onClick={this._loadQuestion}>
                <span className="icon">
                    <i className="fas fa-edit"></i>
                </span>
                <span>Edit</span>
            </button>
        );

        const deleteButton = (
            <button className="button" onClick={this._deleteQuestion} title="Delete Question">
                <span className="icon">
                    <i className="fas fa-trash-alt"></i>
                </span>
            </button>
        );

        const promptEditor = isExpanded && (
            <div className="panel-block quiz-editor-question-prompt">
                <Editor inline value={question.prompt} onEditorChange={this._handlePromptChange} init={{...tinymceConfig, autoresize_min_height: 350}} />
            </div>
        );

        const conceptSelector = isExpanded && (
            <div className="panel-block">
                Concept
            </div>
        );

        const optionsEditor = isExpanded && (
            <form>
            {question.options.map((option, optionIndex) =>
                <div className="panel-block is-flex quiz-editor-question-option" key={option.id}>
                    <label className="radio is-flex">
                        <input
                            id={option.id + "radio"}
                            key={option.id + "radio"}
                            defaultChecked={option.isCorrect}
                            name={"question" + question.id}
                            type="radio" />
                        <span>{ALPHABET[optionIndex]}</span>
                    </label>
                    <span className="quiz-editor-question-option-tinymce-container">
                        <Editor inline initialValue={option.text} init={tinymceConfig} />
                    </span>
                    {/*<input
                        type="text"
                        id={option.id + "text"}
                        className="input"
                        placeholder="(Leave option blank to hide on quiz)"
                        rows="2"
                    defaultValue={option.text} />*/}
                </div>
            )}
            </form>
        );

        return (
            <div className="panel collapsible-question-editor">
                <p className="panel-heading is-flex">
                    {dragHandle}
                    <span style={{textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", paddingLeft: "1rem", cursor: "pointer", minWidth: "0%"}} onClick={this._loadQuestion}>
                        {this.props.questionIndex !== null && `${this.props.questionIndex + 1}. `}
                        {!isExpanded && this.props.defaultPrompt}
                    </span>
                    <span className="is-pulled-right is-flex" style={{margin: "-0.4rem -0.5rem 0 auto"}}>
                        {deleteButton}
                        {editButton}
                        {cancelButton}
                        {saveButton}
                    </span>
                </p>
                {promptEditor}
                {conceptSelector}
                {optionsEditor}
            </div>
        );

    }
}
    
CollapsibleQuestionEditor.propTypes = {
    questionId: PropTypes.string.isRequired,
    questionIndex: PropTypes.number,
    defaultPrompt: PropTypes.string,
    defaultExpanded: PropTypes.bool,
    dragHandleProps: PropTypes.object
};

const QUESTION_QUERY = gql`
query questionQuery($id: ID!) {
    question(id:$id){
        concept
        id
        prompt
        options{
            id
            text
            isCorrect
        }
    }
}
`

export const ADD_COURSE = gql`
mutation addCourseMutation($title:String!)
{
    addCourse(
        title:$title
        ){
            id
        }
    }`
    
export const QUESTION_DELETE = gql`
mutation questionDeleteMutation($id:ID!) {
    deleteQuestion(id:$id){
        id
    }
}`

// Manually wrap in ApolloConsumer to get access to Apollo client to manually fire query
const WithApolloClient = (props) => (
    <ApolloConsumer>
    {client => <CollapsibleQuestionEditor client={client} {...props} />}
    </ApolloConsumer>
    );
    
    export default compose(
        graphql(ADD_COURSE, {name: 'addCourseMutation'}),
        graphql(QUESTION_DELETE, {name: 'questionDeleteMutation'}),
        ) (WithApolloClient)