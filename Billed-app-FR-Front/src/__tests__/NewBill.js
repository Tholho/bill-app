/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import BillsUI from "../views/BillsUI.js";
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import userEvent from "@testing-library/user-event"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router"
import { bills } from "../fixtures/bills.js";



jest.mock("../app/store", () => mockStore)
const mockCreate = jest.fn(mockStore.bills().create);
const mockUpdate = jest.fn(mockStore.bills().update)

window.alert = jest.fn();


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I should see a form with various fields", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const store = null
      const html = NewBillUI()
      document.body.innerHTML = html
      const instance = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })
      expect(instance).toBeTruthy()
    })

    describe("When I select a file for upload", () => {
      test("Then Files others than jpg jpeg and png should not be accepted", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }));

        const store = mockStore;
        document.body.innerHTML = NewBillUI();
        await waitFor(() => screen.getByTestId("file"));

        const instance = new NewBill({ document, onNavigate, store, localStorage: window.localStorage });
        const fileInput = screen.getByTestId("file");

        const handleChangeFile = jest.fn(instance.handleChangeFile.bind(instance));
        fileInput.addEventListener("change", handleChangeFile);

        const file = new File(['notImportant'], 'notAnImage.pdf', { type: 'application/pdf' });

        await userEvent.upload(fileInput, file);

        expect(handleChangeFile).toHaveBeenCalled();

        expect(window.alert).toHaveBeenCalledWith("Format de fichier invalide, merci de charger uniquement des fichiers jpeg, jpg ou png");

        expect(fileInput.value).toBe(""); // L'input devrait être vide
      });
      test("Jpeg, jpg and png files should be accepted", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }));

        const store = mockStore;
        document.body.innerHTML = NewBillUI();
        await waitFor(() => screen.getByTestId("file"));

        const instance = new NewBill({ document, onNavigate, store, localStorage: window.localStorage });
        const fileInput = screen.getByTestId("file");

        const handleChangeFile = jest.fn(instance.handleChangeFile.bind(instance));
        fileInput.addEventListener("change", handleChangeFile);

        const fileJpeg = new File(['notImportant'], 'facturefreemobile.jpeg', { type: 'image/jpeg' });
        const fileJpg = new File(['notImportant'], 'facturefreemobile.jpg', { type: 'image/jpg' });
        const filePng = new File(['dnotImportant'], 'facturefreemobile.png', { type: 'image/png' });

        await userEvent.upload(fileInput, fileJpeg);

        expect(handleChangeFile).toHaveBeenCalledTimes(1);

        expect(fileInput.files[0]).toBe(fileJpeg);
        expect(fileInput.files[0].name).toBe('facturefreemobile.jpeg');
        expect(fileInput.files[0].type).toBe('image/jpeg');

        //Testing Jpg files

        await userEvent.upload(fileInput, fileJpg);

        expect(handleChangeFile).toHaveBeenCalledTimes(2);

        expect(fileInput.files[0]).toBe(fileJpg);
        expect(fileInput.files[0].name).toBe('facturefreemobile.jpg');
        expect(fileInput.files[0].type).toBe('image/jpg');

        //Testing Png files

        await userEvent.upload(fileInput, filePng);

        expect(handleChangeFile).toHaveBeenCalledTimes(3);

        expect(fileInput.files[0]).toBe(filePng);
        expect(fileInput.files[0].name).toBe('facturefreemobile.png');
        expect(fileInput.files[0].type).toBe('image/png');
      });
    })
    describe("When I click on submit and the form is complete", () => {
      test("Then I should return to bills screen", async () => {
        //In fact in this test the form is incomplete because the code doesnt feature proper form validation
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const store = mockStore;
        const html = NewBillUI()
        document.body.innerHTML = html
        new NewBill({ document, onNavigate, store, localStorage: window.localStorage })
        await waitFor(() => screen.getByTestId("form-new-bill"))
        const form = screen.getByTestId("form-new-bill")
        fireEvent.submit(form)
        
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      })
    })
  })
})

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit a newbill from newbill page", () => {
    test("Then it should send data to mock API POST", async () => {

      const mockBills = {
        create: mockCreate,
        update: mockUpdate
      };

      const mockStore = {
        bills() {
          return mockBills;
        }
      };

      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.tld" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      //Both calls are necessary and complementary
      window.onNavigate(ROUTES_PATH.NewBill)
      const instance = new NewBill({ document: document, onNavigate: onNavigate, store: mockStore, localStorage: window.localStorage })

      const fileJpeg = new File(['freemobile'], '../assets/images/facturefreemobile.jpg', { type: 'image/jepg' });
      const submitBtn = screen.getByTestId("submitBtn")
      const fileInput = screen.getByTestId("file")
      userEvent.upload(fileInput, fileJpeg)
      userEvent.click(submitBtn)
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.any(FormData),
          headers: { noContentType: true }
        }));
      })
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "employee@test.tld"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      const logSpy = jest.spyOn(global.console, 'error').mockImplementation(() => { });

      test("Then the console correctly logs the server error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: jest.fn().mockImplementation(() => Promise.reject(new Error("Erreur 400")))

          }
        })
        window.onNavigate(ROUTES_PATH.NewBill)

        const fileInput = screen.getByTestId('file');
        const file = new File(['dummy content'], 'facturefreemobile.jpeg', { type: 'image/jpeg' });
        userEvent.upload(fileInput, file);
        await waitFor(() => expect(logSpy).toHaveBeenCalled());

      })

    })

  })
})
